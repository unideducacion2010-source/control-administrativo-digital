import React, { useState, useEffect } from 'react';
import { ShieldCheck, KeyRound, User, RefreshCw, HelpCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (isAdmin: boolean) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [error, setError] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySent, setRecoverySent] = useState(false);

  // Generate random 4-character captcha
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setCaptchaInput('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (captchaInput.trim().toUpperCase() !== captchaCode) {
      setError('El código captcha es incorrecto. Intente nuevamente.');
      generateCaptcha();
      return;
    }

    if (!username.trim() || !password.trim()) {
      setError('Por favor ingrese usuario y contraseña.');
      return;
    }

    // Accept admin or any valid user credentials
    if (username === 'admin' || username === 'usuario' || password.length >= 4) {
      onLoginSuccess(username === 'admin');
    } else {
      setError('Credenciales inválidas. (Pruebe con admin / admin123)');
    }
  };

  const handleRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail.trim()) return;
    setRecoverySent(true);
    setTimeout(() => {
      setShowRecovery(false);
      setRecoverySent(false);
      setRecoveryEmail('');
      alert('Se han enviado las instrucciones de recuperación a su correo.');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/50 to-stone-100 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border border-amber-100 p-6 sm:p-8 transition-all">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 mb-3 shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-800 tracking-tight">Control Administrativo</h1>
          <p className="text-sm text-stone-500 mt-1">Gestión de Ganancias, Ventas e Inventario</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm flex items-center gap-2 animate-shake">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-2">
              Usuario
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
                <User className="w-5 h-5" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition text-base"
                placeholder="Ej. admin"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
                <KeyRound className="w-5 h-5" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition text-base"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Captcha Box */}
          <div className="bg-amber-50/60 border border-amber-200/70 rounded-2xl p-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
              Código de Verificación (Captcha)
            </label>
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-white px-5 py-2.5 rounded-xl border border-amber-300 shadow-sm select-none tracking-widest text-xl font-black text-amber-800 italic bg-gradient-to-r from-amber-100 to-orange-100">
                {captchaCode}
              </div>
              <button
                type="button"
                onClick={generateCaptcha}
                className="p-2.5 bg-white hover:bg-amber-100 text-stone-700 rounded-xl border border-amber-200 transition shadow-sm active:scale-95"
                title="Generar otro código"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
              required
              placeholder="Ingrese el código de la imagen"
              className="w-full px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50 uppercase tracking-wider text-sm font-bold"
            />
          </div>

          <div className="flex items-center justify-between text-sm pt-1">
            <button
              type="button"
              onClick={() => setShowRecovery(true)}
              className="text-amber-700 hover:text-amber-800 font-medium hover:underline flex items-center gap-1"
            >
              <HelpCircle className="w-4 h-4" /> ¿Olvidó su contraseña?
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-4 px-6 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold rounded-2xl shadow-lg shadow-amber-600/25 active:scale-[0.99] transition duration-200 flex items-center justify-center gap-2 text-base"
          >
            <span>Iniciar Sesión</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        {/* Quick Demo hint */}
        <div className="mt-6 pt-6 border-t border-stone-100 text-center">
          <p className="text-xs text-stone-400">
            Acceso rápido demo: Usuario <strong className="text-stone-600">admin</strong> / Contraseña <strong className="text-stone-600">admin123</strong>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showRecovery && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-amber-100 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-stone-800 mb-2">Recuperar Contraseña</h3>
            <p className="text-xs text-stone-500 mb-4">
              Ingrese su correo electrónico registrado para enviarle un enlace de restablecimiento.
            </p>

            {recoverySent ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-sm font-semibold">¡Correo enviado con éxito!</p>
                <p className="text-xs text-emerald-600">Verifique su bandeja de entrada.</p>
              </div>
            ) : (
              <form onSubmit={handleRecovery} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    required
                    placeholder="admin@negocio.com"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRecovery(false)}
                    className="flex-1 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium rounded-xl text-sm transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl text-sm shadow-md transition"
                  >
                    Enviar Enlace
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
