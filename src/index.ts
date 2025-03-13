import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import json from "./utils/middlewares/json.js";
import launchTrophiesRoute from "./routes/trophies.js";
import launchEnthusiastsRoute from "./routes/enthusiasts.js";
import launchHobbiesRoute from "./routes/hobbies.js";
import launchPostsRoute from "./routes/posts.js";
import session from "express-session";
import { BaseClient, Issuer } from "openid-client";
import cookieParser from "cookie-parser";
import launchSessionRoute from "./routes/session.js";
import print from "./utils/middlewares/print.js";

declare module 'express-session' {
    interface SessionData {
        nonce: string;
        state: string;
    }
}


const dbPassword: string = "74V02uDuesyMUgGo";
const uri: string = "mongodb+srv://maciekgmurse:" + dbPassword + "@outsite.ubmve.mongodb.net/?retryWrites=true&w=majority&appName=Outsite";
const dbName: string = 'outsite';
const client = new MongoClient(uri);
const outsiteDb = client.db(dbName);

const port: number = 3001;

let cognitoClient: BaseClient;
// Initialize OpenID Client
async function initializeClient() {
    const issuer = await Issuer.discover('https://cognito-idp.eu-north-1.amazonaws.com/eu-north-1_bxXBLQOlb');
    cognitoClient = new issuer.Client({
        client_id: '69jsmdkbec8dn150mi19r22nab',
        client_secret: '<client secret>',
        redirect_uris: ['https://d84l1y8p4kdic.cloudfront.net'],
        response_types: ['code']
    });
};
initializeClient().catch(console.error);

const app = express();
app.use(cookieParser());
app.use(print);
app.use(json);
app.use(cors({ credentials: true, origin: true }));
app.use(session({
    secret: 'some secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false
    }
}));

/*
app.use((req, _, next) => {
    req.session.isLoggedIn ??= false;
    next();
});
*/

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

launchTrophiesRoute(app, outsiteDb);
launchEnthusiastsRoute(app, outsiteDb);
launchHobbiesRoute(app, outsiteDb);
launchPostsRoute(app, outsiteDb);
launchSessionRoute(app);