import Express from "express";
import { Db, ObjectId } from "mongodb";
import ICreateHobbyRequest from "../models/ICreateHobbyRequest.js";
import isNotEmptyString from "../utils/isNotEmptyString.js";
import IHobby from "../models/IHobby.js";

export default function launchRoute(app: Express.Application, outsiteDb: Db) {
    const hobbiesCollection = outsiteDb.collection<IHobby>('hobbies');

    app.get('/hobbies', async (req, res) => {
        console.log('Entered getHobbies route, sid: ' + req.sessionID);

        const { userSub } = req.query;
        if (userSub) {

            console.log("GetHobbies: Trying to fetch hobbies.");

            const hobbies = await hobbiesCollection
                .find({ enthusiastId: userSub })
                .toArray();

            console.log("GetHobbies: Sending back hobbies.");

            res.send(hobbies);
            res.end();
            return;

        } else {
            console.log("GetHobbies: No user sub.");
            res.sendStatus(403);
            return;
        }
    });

    app.get('/hobbies/:hobbyId', async (req, res) => {
        console.log('Entered single getHobbies route, sid: ' + req.sessionID);

        const { hobbyId } = req.params;
        const { userSub } = req.query;
        if (userSub && hobbyId) {

            console.log("GetHobbies: Trying to fetch single hobby.");

            const hobby = await hobbiesCollection
                .findOne({
                    enthusiastId: userSub,
                    _id: new ObjectId(hobbyId)
                });

            console.log("GetHobbies: Sending back single hobby.");

            res.send(hobby);
            res.end();
            return;

        } else {
            console.log("Single GetHobbies: No user sub.");
            res.sendStatus(403);
            return;
        }
    });


    app.post('/hobbies', async (req, res) => {
        const { hobby }: ICreateHobbyRequest = req.body;
        const { userSub } = req.query;
        if (!userSub) {
            console.error("No user sub.");
            res.status(404);
            res.send("No user sub.");

        } else {
            try {
                if (isNotEmptyString(hobby.name) && isNotEmptyString(hobby.description)) {
                    const result = await hobbiesCollection.insertOne({
                        name: hobby.name,
                        description: hobby.description,
                        enthusiastId: userSub as string
                    });
                    res.send(result.insertedId);

                } else {
                    throw Error("Wrong input data.");
                }
            } catch (error) {
                console.error("Failed to create the hobby: ", error);
                res.status(404);
                res.send("Wrong input data.");

            }
        }

    });

    app.delete('/hobbies', async (req, res) => {
        const { hobbyId } = req.query;
        if (typeof hobbyId === 'string') {
            try {
                const deleteRes = await hobbiesCollection.deleteOne({
                    _id: new ObjectId(hobbyId)
                });
                res.status(200).end();
                return;

            } catch (error) {
                console.error("Failed to delete the hobby: ", error);
                res.status(400).end();
                return;

            }
        } else {
            console.error("HobbyId query paramter is invalid.");
            console.error("HobbyId: ", hobbyId);
            res.status(400).end();
        }
    })
}
