export default function AppLogo() {
    return (
        <div className="flex w-full items-center justify-center">
            <img
                src="/assets/logo/ficobank.png"
                alt="FICOBank"
                className="w-full h-auto max-h-16 object-contain"
                style={{ borderRadius: '10px 0 10px 0' }}
            />
        </div>
    );
}
