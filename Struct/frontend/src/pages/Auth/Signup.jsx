import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../data/api";

const Signup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirm_password: "",
    user_type: "student", // Default value
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.post("/register/", formData, { auth: false });

      // If registration is successful, log the user in
      const loginData = await api.post(
        "/login/",
        { email: formData.email, password: formData.password },
        { auth: false }
      );

      // persist token for future requests
      localStorage.setItem("authToken", loginData.token);

      // Use auth context login function
      login(loginData.token, {
        id: loginData.user_id,
        email: loginData.email,
        username: loginData.username,
        userType: loginData.user_type,
      });

      // Redirect to home page
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden text-slate-100 bg-gradient-to-b from-[#070B1A] via-[#0B1030] to-[#0E163D]">
      {/* Cosmic background layers */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -bottom-60 -right-40 w-[700px] h-[700px] rounded-full bg-fuchsia-600/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0)_60%)]" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-6">
        <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-2xl">
          {/* Brand */}
          <div className="flex items-center justify-center mb-2">
            <img
              src={logo}
              alt="Struct Academy Logo"
              className="h-8 opacity-90"
            />
          </div>

          {/* Header */}
          <h2 className="text-2xl font-extrabold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-fuchsia-300 to-indigo-300">
            Create an Account
          </h2>
          <p className="text-sm text-slate-300 text-center mb-4">
            Join Struct Academy and start your learning journey today.
          </p>

          {/* Error Message */}
          {error && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
              role="alert"
            >
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {/* Sign Up Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-medium text-slate-200"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                value={formData.username}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-slate-100 placeholder-slate-400 focus:ring-amber-400 focus:border-amber-400 text-sm"
                placeholder="Enter your username"
                required
              />
            </div>
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
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-slate-100 placeholder-slate-400 focus:ring-amber-400 focus:border-amber-400 text-sm"
                placeholder="Enter your email"
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
                type={showPassword ? "text" : "password"}
                id="password"
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-slate-100 placeholder-slate-400 focus:ring-amber-400 focus:border-amber-400 text-sm"
                placeholder="Create a password"
                required
              />
            </div>
            <div>
              <label
                htmlFor="confirm_password"
                className="block text-xs font-medium text-slate-200"
              >
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-slate-100 placeholder-slate-400 focus:ring-amber-400 focus:border-amber-400 text-sm"
                placeholder="Confirm your password"
                required
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="show-password"
                className="h-4 w-4 text-amber-400 border-white/20 bg-white/10 rounded"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
              />
              <label
                htmlFor="show-password"
                className="ml-2 text-xs text-slate-300"
              >
                Show Password
              </label>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 rounded-md text-sm font-semibold bg-gradient-to-r from-amber-400 to-fuchsia-500 hover:from-indigo-400 hover:to-amber-300 text-white transition-all duration-300 shadow-[0_0_20px_rgba(251,191,36,0.3)] disabled:opacity-60"
            >
              {loading ? "Processing..." : "Sign Up"}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-4 text-center text-xs text-slate-300">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-amber-300 font-medium hover:underline"
            >
              Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
