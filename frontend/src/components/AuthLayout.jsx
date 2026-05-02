function AuthLayout({ title, children, footer }) {
    return (
        <div className="auth-container">
            <div className="auth-box">
                <h2>{title}</h2>
                {children}
                <div className="auth-footer">{footer}</div>
            </div>
        </div>
    )
}

export default AuthLayout