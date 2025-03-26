import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import connection from "../database.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

passport.use(
  new LocalStrategy(
    //add userNameField
    { usernameField: "email" },
    function verify(username, password, done) {}
  )
);
