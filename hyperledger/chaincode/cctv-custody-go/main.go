package main

import (
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
)

type SmartContract struct {
	contractapi.Contract
}

type CustodyRecord struct {
	RecordID           string          `json:"record_id"`
	EventID            string          `json:"event_id"`
	CameraID           string          `json:"camera_id"`
	Timestamp          string          `json:"timestamp"`
	Hash               string          `json:"hash"`
	EventType          string          `json:"event_type"`
	Metadata           json.RawMessage `json:"metadata"`
	Filename           string          `json:"filename"`
	RecordingReference string          `json:"recording_reference"`
	RegisteredAt       string          `json:"registered_at"`
	RegisteredBy       string          `json:"registered_by"`
	Status             string          `json:"status"`
	TxID               string          `json:"transaction_id"`
}

func (s *SmartContract) CommitCCTVCustodyLog(ctx contractapi.TransactionContextInterface, payloadJSON string) (string, error) {
	var record CustodyRecord
	if err := json.Unmarshal([]byte(payloadJSON), &record); err != nil {
		return "", fmt.Errorf("invalid custody payload: %w", err)
	}

	if record.RecordID == "" {
		return "", fmt.Errorf("record_id is required")
	}
	if record.EventID == "" {
		return "", fmt.Errorf("event_id is required")
	}
	if record.Hash == "" {
		return "", fmt.Errorf("hash is required")
	}

	key, err := ctx.GetStub().CreateCompositeKey("cctvRecord", []string{record.RecordID})
	if err != nil {
		return "", err
	}

	existing, err := ctx.GetStub().GetState(key)
	if err != nil {
		return "", err
	}
	if existing != nil {
		return "", fmt.Errorf("record %s already exists", record.RecordID)
	}

	eventKey, err := ctx.GetStub().CreateCompositeKey("cctvEvent", []string{record.EventID})
	if err != nil {
		return "", err
	}

	if existingEvent, err := ctx.GetStub().GetState(eventKey); err != nil {
		return "", err
	} else if existingEvent != nil {
		return "", fmt.Errorf("event %s already exists", record.EventID)
	}

	record.Status = "registered"
	record.TxID = ctx.GetStub().GetTxID()

	bytes, err := json.Marshal(record)
	if err != nil {
		return "", err
	}

	if err := ctx.GetStub().PutState(key, bytes); err != nil {
		return "", err
	}
	if err := ctx.GetStub().PutState(eventKey, []byte(record.RecordID)); err != nil {
		return "", err
	}

	return `{"ok":true}`, nil
}

func (s *SmartContract) QueryCCTVCustodyLog(ctx contractapi.TransactionContextInterface, payloadJSON string) (string, error) {
	var query struct {
		RecordID string `json:"record_id"`
		EventID  string `json:"event_id"`
	}
	if err := json.Unmarshal([]byte(payloadJSON), &query); err != nil {
		return "", fmt.Errorf("invalid query payload: %w", err)
	}

	recordID := query.RecordID
	if recordID == "" && query.EventID != "" {
		eventKey, err := ctx.GetStub().CreateCompositeKey("cctvEvent", []string{query.EventID})
		if err != nil {
			return "", err
		}
		bytes, err := ctx.GetStub().GetState(eventKey)
		if err != nil {
			return "", err
		}
		if bytes == nil {
			return "", fmt.Errorf("event %s not found", query.EventID)
		}
		recordID = string(bytes)
	}
	if recordID == "" {
		return "", fmt.Errorf("record_id or event_id is required")
	}

	key, err := ctx.GetStub().CreateCompositeKey("cctvRecord", []string{recordID})
	if err != nil {
		return "", err
	}

	bytes, err := ctx.GetStub().GetState(key)
	if err != nil {
		return "", err
	}
	if bytes == nil {
		return "", fmt.Errorf("record %s not found", recordID)
	}

	return string(bytes), nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(new(SmartContract))
	if err != nil {
		panic(err)
	}

	if err := chaincode.Start(); err != nil {
		panic(err)
	}
}
