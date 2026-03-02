export default function ConfirmButton({ onConfirm, children, className = "btn btn-danger", message = "Confirmar?" }) {
  return (
    <button
      className={className}
      onClick={() => {
        if (window.confirm(message)) onConfirm();
      }}
    >
      {children}
    </button>
  );
}