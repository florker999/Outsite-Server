import Express from "express";

export default (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    if (req.headers["content-type"] === 'application/json') {

        console.log("Json middleware: Starting to read the data.");

        let body = '';
        req.on('data', (chunk: any) => { body += chunk });
        req.on('end', () => {

            console.log("Json middleware: Finished reading data: " + body);
            req.body = JSON.parse(body);
            next();
        });
        
    } else {
        next();
    }
}
