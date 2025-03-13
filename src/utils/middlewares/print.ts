import Express from "express";

export default (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    log('Cookies: ', req.cookies);
    log('Header: ', req.headers);
    log('Session id: ', req.sessionID);
    log('Req:', req)

    next();
}

function log(...objects: any[]) {
    for (const object of objects) {
        console.log("Print middleware: ", object);
    }
}