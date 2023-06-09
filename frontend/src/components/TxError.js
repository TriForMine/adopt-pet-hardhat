export default function TxError({ message, dissmiss }) {
    return (
        <div className="message-warning" role="alert">
            <div>Error sending transaction: { message }</div>
            <br />
            <button type="button dismiss-button" className="close" onClick={dissmiss}>
                <div>Dismiss</div>
            </button>
        </div>
    )
}
