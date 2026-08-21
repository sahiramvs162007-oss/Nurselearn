const Notification = require("../models/Notification");

exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({
      destinatario: req.session.userId,
    })
      .sort("-createdAt")
      .lean();
    res.render("notificaciones", {
      titulo: "Notificaciones",
      user: req.session.userName,
      notifications,
      error: req.flash("error"),
      success: req.flash("success"),
    });
  } catch (err) {
    next(err);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, destinatario: req.session.userId },
      { leido: true },
    );
    res.redirect(req.get("Referer") || "/notificaciones");
  } catch (err) {
    next(err);
  }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { destinatario: req.session.userId, leido: false },
      { leido: true },
    );
    res.redirect("/notificaciones");
  } catch (err) {
    next(err);
  }
};
