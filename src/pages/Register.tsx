import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Gavel } from "lucide-react";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"admin" | "tabber">("tabber");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    const { error } = await signUp(email, password, fullName, role);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-slate-900 p-4 rounded-full">
              {/* <Gavel className="w-8 h-8 text-white" />
               */}
              <svg
  xmlns="http://www.w3.org/2000/svg"
  width="800"
  height="800"
  viewBox="0 0 64 64"
  aria-hidden="true"
  role="img"
  className="iconify iconify--emojione"
  preserveAspectRatio="xMidYMid meet"
>
  <path
    d="M13.5 31.5c0-2.6 2.4-4.7 5.3-4.7h.1c2.9 0 6.3 2.1 6.3 4.7L22.6 6.4c0-2.4 3-4.4 6.9-4.4h.1c3.8 0 6.9 2 6.9 4.4L35.3 31c0-2.6 2.4-4.7 5.3-4.7h.1c2.9 0 5.3 2.1 5.3 4.7v2.7c.5-1.9 2.4-3.2 4.6-2.7c4.5 1.2 3.6 4.8 4.1 8.7c.5 4.8 1.7 7.9 1.3 9.6c-1 3.7-3.7 3.2-5.1 4.2c-1.4 1-1.8 2.6-2.9 3.6c-2.2 2-6.2 1.6-9.8 2.5c-3.1.8-5.9 2.6-8.3 2.3c-2.7-.3-3.4-2.6-6.4-4c-3-1.4-7.1-.7-8.3-3.1c-2.3-4.8-1.7-23.3-1.7-23.3"
    fill="#ffdd67"
  />
  <g fill="#eba352">
    <path d="M13.5 31.5c0-1.4.7-2.7 1.8-3.5c-1.9 2.4-.6 19.4 1.7 24.2c1.2 2.4 5.3 1.7 8.3 3.1c3 1.4 3.7 3.8 6.4 4c2.4.3 5.2-1.4 8.3-2.1c3.6-.9 6.1-.6 8.3-2.6c1.1-1 1.6-2.5 3.8-3.2c1.6-.5 2.7-1 3.9-2.2v.1c-1 3.7-3.7 3.2-5.1 4.2c-1.4 1-1.8 2.6-2.9 3.6c-2.2 2-6.2 1.6-9.8 2.5c-3.1.8-5.9 2.6-8.3 2.3c-2.7-.3-3.4-2.6-6.4-4c-3-1.4-7.1-.7-8.3-3.1c-2.3-4.8-1.7-23.3-1.7-23.3" />
    <path d="M22.6 5.3c-.9 3.8 2.5 38.4 2.5 38.4c0 2.5 1.3 1.5 1.3-1c0 0-3.6-32.5-2.6-37.3c.4-2 1.8-2.6 4.2-3.3c0 0-4.6.2-5.4 3.2" />
    <path d="M37 42.3v-13c0-.7.1-1.4.5-2c-1.3.9-2.1 2.2-2.1 3.7v13c-.1 2.7 1.6.9 1.6-1.7" />
    <path d="M47.4 43.6V33.2c0-.6.1-1.2.4-1.8c-1.1.8-1.9 2-1.9 3.4v10.4c0 2.3 1.5.7 1.5-1.6" />
    <path d="M34.4 10.8c.8-5.3-1.7-5.5-4.8-5.5c-3.1 0-5.6.2-4.8 5.5c.3 2 2.4 2.7 4.8 2.7s4.5-.8 4.8-2.7" />
  </g>
  <path
    d="M34.5 9.9c.8-5.7-1.7-5.9-4.9-5.9s-5.7.2-4.9 5.8c.3 2.1 2.4 2.8 4.9 2.8c2.5 0 4.6-.7 4.9-2.7"
    fill="#ffe8dc"
  />
  <path
    d="M15.2 53.6c-3.6-4.2-8.3-6.4-7.1-9.5c1-3 3.1-2.9 5.8-6.3l1.3 15.8"
    fill="#eba352"
  />
</svg>

            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-slate-900 mb-2">
            MA CHUDA
          </h1>
          {/* <p className="text-center text-slate-600 mb-8">
            Register for Tournament Management
          </p> */}

          {/* <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )} */}
          {/* 
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                Account created successfully! Redirecting...
              </div>
            )}

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-2">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all outline-none"
                placeholder="John Doe"
                required
              />
            </div> */}

          {/* <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all outline-none"
                placeholder="you@example.com"
                required
              />
            </div> */}

          {/* <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all outline-none"
                placeholder="At least 6 characters"
                required
              /> */}
        </div>

        {/* <div>
              <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-2">
                Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'tabber')}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all outline-none bg-white"
              >
                <option value="tabber">Tabber</option>
                <option value="admin">Admin</option>
              </select>
            </div> */}

        {/* <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button> */}
        {/* </form> */}

        {/* <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              Already have an account? <span className="font-medium">Sign In</span>
            </button>
          </div> */}
      </div>
    </div>
    // </div>
  );
}
