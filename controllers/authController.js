const User = require('../models/User');
const Ficha = require('../models/Ficha');

// GET /auth/login
exports.getLogin = (req, res) => {
  res.render('auth/login', { titulo: 'Iniciar Sesión', error: req.flash('error'), success: req.flash('success') });
};

// POST /auth/login
exports.postLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error', 'Credenciales inválidas.');
      return res.redirect('/auth/login');
    }

    const match = await user.compararPassword(password);
    if (!match) {
      req.flash('error', 'Credenciales inválidas.');
      return res.redirect('/auth/login');
    }

    // Validaciones por rol
    if (user.rol === 'aprendiz') {
      if (user.estado === 'Inactivo') {
        req.flash('error', 'Tu cuenta está inactiva. Contacta al administrador.');
        return res.redirect('/auth/login');
      }
      const ficha = await Ficha.findOne({ aprendices: user._id });
      if (!ficha) {
        req.flash('error', 'No estás matriculado en ninguna ficha. Contacta al administrador.');
        return res.redirect('/auth/login');
      }
    }

    if (user.rol === 'instructor') {
      const ficha = await Ficha.findOne({ 'instructores.instructor': user._id });
      if (!ficha) {
        req.flash('error', 'No tienes fichas asignadas. Contacta al administrador.');
        return res.redirect('/auth/login');
      }
    }

    // Guardar sesión
    req.session.userId = user._id.toString();
    req.session.userRol = user.rol;
    req.session.userName = user.nombre;

    const redirectMap = { admin: '/admin', instructor: '/instructor', aprendiz: '/aprendiz' };
    res.redirect(redirectMap[user.rol]);

  } catch (err) {
    console.error(err);
    req.flash('error', 'Error interno. Intenta de nuevo.');
    res.redirect('/auth/login');
  }
};

// POST /auth/logout
exports.logout = (req, res) => {
  req.session.destroy(() => res.redirect('/auth/login'));
};
