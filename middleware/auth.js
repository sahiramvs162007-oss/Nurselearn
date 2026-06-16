// Verifica que el usuario esté autenticado
exports.isAuth = (req, res, next) => {
  if (req.session && req.session.userId) return next();
  req.flash('error', 'Debes iniciar sesión para continuar.');
  res.redirect('/auth/login');
};

// Fábrica de middleware por rol
exports.hasRole = (...roles) => (req, res, next) => {
  if (req.session && roles.includes(req.session.userRol)) return next();
  res.status(403).render('error', {
    titulo: 'Acceso denegado',
    mensaje: 'No tienes permisos para acceder a esta sección.',
    user: req.session.userName || null
  });
};
