import '../styles/main.css'
import logo from "../assets/uni-connect-sm.png"

function IconMail(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4.2-7.4 4.63a1 1 0 0 1-1.06 0L4 8.2V6l8 5 8-5v2.2Z"
      />
    </svg>
  )
}

function IconArrowRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M13.17 5.29a1 1 0 0 0 0 1.42L17.46 11H4a1 1 0 0 0 0 2h13.46l-4.29 4.29a1 1 0 1 0 1.42 1.42l6-6a1 1 0 0 0 0-1.42l-6-6a1 1 0 0 0-1.42 0Z"
      />
    </svg>
  )
}

export default function Login() {
  return (
    <div className="loginShell">
      <section className="loginModal" aria-label="Create profile">
        <header className="loginTopbar">
          <img className='logo' src={logo} alt="UniConnect logo" />
        </header>

        <div className="loginBody">
          <h1 className="loginTitle">CREATE YOUR PROFILE</h1>
          <p className="loginSub">
            Already have an account? <a href="#login">Login</a>
          </p>

          <form className="form" onSubmit={(e) => e.preventDefault()}>
            <label className="fieldLabel" htmlFor="email">
              Email Address
            </label>
            <div className="inputWrap">
              <span className="inputIcon" aria-hidden="true">
                <IconMail />
              </span>
              <input
                className="input"
                id="email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email address"
                required
              />
            </div>

            <button className="primaryBtn" type="submit">
              Next
              <span className="primaryBtnIcon" aria-hidden="true">
                <IconArrowRight />
              </span>
            </button>
          </form>

          <p className="legal">
            By registering, you accept UniConnect <a href="#tos">Terms</a>{' '}
            and <a href="#privacy">Privacy policy</a>.
          </p>
        </div>
      </section>
    </div>
  )
}