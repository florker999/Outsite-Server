import Express from "express";

export default function launchRoute(app: Express.Application) {
    app.get('/session', (req, res) => {
        console.log("Entered Session route, sid: ", req.sessionID);
        
        res.sendStatus(200);
        return;
    });
}