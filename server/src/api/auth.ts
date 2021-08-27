import { Router } from "express";

export const auth = Router()
  .post("/guess-login", (req, res, next) => req.context.auth.guessLogin(req, res, next))
  .get("/callback", (req, res, next) => req.context.auth.callback(req, res, next))
  .post("/login", (req, res, next) => req.context.auth.login(req, res, next))
  .get("/logout", (req, res, next) => req.context.auth.logout(req, res, next))
  .get("/logout/callback", (req, res, next) => req.context.auth.logoutCallback(req, res, next))
  .post("/new-password", (req, res, next) => req.context.auth.newPassword(req, res, next))
  .post("/forgot-password", (req, res, next) => req.context.auth.forgotPassword(req, res, next))
  .post("/confirm-forgot-password", (req, res, next) =>
    req.context.auth.confirmForgotPassword(req, res, next)
  )
  .get("/verify-email", (req, res, next) => req.context.auth.verifyEmail(req, res, next));
