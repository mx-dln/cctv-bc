export type * from './auth';
export type * from './navigation';
export type * from './ui';

export interface Camera {
    id: number;
    provider: string;
    provider_camera_id: string;
    name: string;
    location: string | null;
    status: 'online' | 'offline' | 'disconnected';
    resolution: string | null;
    fps: number | null;
    last_seen: string | null;
    created_at: string;
    updated_at: string;
}

export interface GeneratedLog {
    id: number;
    record_id: string | null;
    filename: string | null;
    registered_by: User | null;
    event_id: string;
    camera_id: number;
    camera: Camera;
    event_type: string;
    label: string | null;
    sub_label: string | null;
    object_type: string | null;
    started_at: string | null;
    ended_at: string | null;
    duration: number | null;
    score: number;
    top_score: number;
    false_positive: boolean;
    snapshot_url: string | null;
    recording_url: string | null;
    zones: string[] | null;
    thumbnail: string | null;
    status: 'pending' | 'registered' | 'verified' | 'tampered' | 'missing';
    hash_record: HashRecord | null;
    blockchain_transactions: BlockchainTransaction[];
    created_at: string;
    updated_at: string;
}

export interface HashRecord {
    id: number;
    log_id: number;
    algorithm: string;
    hash_value: string;
    previous_hash: string | null;
    hash_chain_index: number;
    hashed_payload: Record<string, any> | null;
    hash_duration_ms: number | null;
    blockchain_transaction: BlockchainTransaction | null;
    created_at: string;
}

export interface BlockchainTransaction {
    id: number;
    log_id: number;
    transaction_id: string;
    block_number: string | null;
    channel: string;
    chaincode: string;
    status: string;
    response: Record<string, any> | null;
    error_message: string | null;
    committed_at: string | null;
    created_at: string;
}

export interface Alert {
    id: number;
    alert_id: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    context: Record<string, any> | null;
    alertable_id: number;
    alertable_type: string;
    is_read: boolean;
    read_at: string | null;
    resolved_by: number | null;
    resolver: User | null;
    resolved_at: string | null;
    created_at: string;
}

export interface AuditReport {
    id: number;
    report_id: string;
    user_id: number;
    user: User;
    title: string;
    type: string;
    filters: Record<string, any> | null;
    summary: Record<string, any> | null;
    total_logs: number;
    verified_count: number;
    tampered_count: number;
    status: string;
    format: string;
    file_path: string | null;
    generated_at: string;
    created_at: string;
}

export interface ActivityLog {
    id: number;
    user_id: number | null;
    user: User | null;
    action: string;
    module: string;
    description: string | null;
    properties: Record<string, any> | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
}

export interface DashboardStats {
    total_cameras: number;
    online_cameras: number;
    offline_cameras: number;
    disconnected_cameras: number;
    events_today: number;
    total_events: number;
    verified_events: number;
    tampered_events: number;
    pending_events: number;
    blockchain_transactions: number;
    successful_transactions: number;
    failed_transactions: number;
    active_alerts: number;
    critical_alerts: number;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}
