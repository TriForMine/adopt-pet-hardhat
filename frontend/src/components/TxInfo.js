export function TxInfo({ message }) {
    return (
        <div className="message-warning">
            <div>Waiting for transaction: { message }</div>
        </div>
    )
}
