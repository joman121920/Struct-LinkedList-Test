import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../data/api";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [id]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await api.post(
        "/login/",
        {
          email: formData.email,
          password: formData.password,
        },
        { auth: false }
      );

      // persist token so future requests can include Authorization
      localStorage.setItem("authToken", data.token);

      // Use auth context login function
      login(data.token, {
        id: data.user_id,
        email: data.email,
        username: data.username,
        userType: data.user_type,
      });

      // Redirect to home page or dashboard
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Rest of the component stays the same
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden text-slate-100 bg-gradient-to-b from-[#070B1A] via-[#0B1030] to-[#0E163D]">
      {/* Cosmic background layers */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -bottom-60 -right-40 w-[700px] h-[700px] rounded-full bg-fuchsia-600/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0)_60%)]" />
      </div>

      <div className="relative z-10 w-full max-w-lg mx-auto px-6">
        <div className="bg-white/10 backdrop-blur-md border border-white/10 p-8 rounded-2xl shadow-2xl">
          {/* Struct Logo */}
          <div className="flex items-center justify-center mb-2">
            <img
              src={logo}
              alt="Struct Academy Logo"
              className="h-10 opacity-90"
            />
          </div>

          {/* Header */}
          <h2 className="text-3xl font-extrabold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-fuchsia-300 to-indigo-300">
            Welcome Back!
          </h2>
          <p className="text-slate-300 text-center mb-6">
            Log in to your account to continue learning.
          </p>

          {/* Error Message */}
          {error && (
            <div
              className="bg-red-500/10 border border-red-400/30 text-red-200 px-4 py-3 rounded relative mb-6"
              role="alert"
            >
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-slate-200"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className="mt-1 block w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-slate-100 placeholder-slate-400 focus:ring-amber-400 focus:border-amber-400 text-sm"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-slate-200"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                className="mt-1 block w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-slate-100 placeholder-slate-400 focus:ring-amber-400 focus:border-amber-400 text-sm"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 rounded-md text-sm font-semibold bg-gradient-to-r from-amber-400 to-fuchsia-500 hover:from-indigo-400 hover:to-amber-300 text-white transition-all duration-300 shadow-[0_0_20px_rgba(251,191,36,0.3)]"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-slate-300">
            Don&apos;t have an account?{" "}
            <a
              href="/signup"
              className="text-amber-300 font-medium hover:underline"
            >
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
