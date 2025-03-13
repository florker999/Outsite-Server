import Express from "express";
import { Db, ObjectId } from "mongodb";
import ICreateTrophyRequest from "../models/ICreateTrophyRequest.js";
import isNotEmptyString from "../utils/isNotEmptyString.js";
import ITrophy, { TIconType } from "../models/ITrophy.js";

export default function launchRoute(app: Express.Application, outsiteDb: Db): void {
    const trophiesCollection = outsiteDb.collection<ITrophy>('trophies');

    app.get('/trophies', async (req, res) => {
        const hobbyId = req.query.hobbyId;
        if (typeof hobbyId === 'string' && ObjectId.isValid(hobbyId)) {
            const trophies = await trophiesCollection
                .find({ hobbyId })
                .toArray();
            res.send(trophies);
            res.end();
            return;

        } else {
            res.status(404);
            res.send("Wrong input data.");
            res.end();
            return;
        }
    });

    app.post('/trophies', async (req, res) => {
        console.log('Entered add trophy route, sid: ' + req.sessionID);
        const { hobbyId, trophy }: ICreateTrophyRequest = req.body;

        try {
            if (isNotEmptyString(trophy.title) && isNotEmptyString(trophy.description)) {
                console.log("AddTrophy: Trying to add trophy.");
                const result = await trophiesCollection.insertOne({
                    title: trophy.title,
                    description: trophy.description,
                    isGained: false,
                    iconType: trophy.iconType as TIconType,
                    hobbyId: hobbyId
                });

                console.log("AddTrophy: Trophy added successfully.");
                res.send(result.insertedId.toString());
                res.end();
                return;

            } else {
                console.log("AddTrophy: Invalid payload: ", req.body);
                res.status(404);
                res.send("Wrong input data.");
                res.end();
                return;

            }
        } catch (error) {
            console.error("Failed to create the trophy; ", error);
        }

    });

    app.delete('/trophies', async (req, res) => {
        console.log('Entered delete trophy route, sid: ' + req.sessionID);

        const { trophyId } = req.query;
        if (typeof trophyId === 'string') {
            try {
                console.log("DeleteTrophy: Trying to delete trophy.");
                const deleteRes = await trophiesCollection.deleteOne({
                    _id: new ObjectId(trophyId)
                });
                console.log("DeleteTrophy: Trophy successfully deleted.");
                res.status(200).end();
                return;

            } catch (error) {
                console.error("Failed to delete the trophy: ", error);
                res.status(400).end();
                return;

            }
        } else {
            console.error("TrophyId query paramter is invalid.");
            console.error("TrophyId: ", trophyId);
            res.status(400).end();
        }
    })
}
