import Express from "express";
import ICreatePostRequest from "../models/ICreatePostRequest.js";
import isNotEmptyString from "../utils/isNotEmptyString.js";
import { Db, ObjectId } from "mongodb";
import IPost from "../models/IPost.js";

export default function launchRoute(app: Express.Application, outsiteDb: Db): void {
    const postsCollection = outsiteDb.collection<IPost>('posts');

    app.get('/posts', async (req, res) => {
        const { hobbyId, postId } = req.query;
        try {
            if (typeof postId === 'string') {
                const post = await postsCollection
                    .findOne({
                        hobbyId,
                        _id: new ObjectId(postId)
                    });
                res.send(post);
                res.end();
                return;

            } else {
                const posts = await postsCollection
                    .find({ hobbyId })
                    .toArray();
                res.send(posts);
                res.end();
                return;
            }

        } catch (error) {
            res.status(404);
            res.send("Wrong input data.");
        }

    });

    app.post('/posts', async (req, res) => {
        console.log('Entered addPost route, sid: ' + req.sessionID);

        const { hobbyId, post }: ICreatePostRequest = req.body;
        try {
            if (isNotEmptyString(post.title) && isNotEmptyString(post.content)) {
                console.log('Trying to add post.');
                const result = await postsCollection.insertOne({
                    title: post.title,
                    content: post.content,
                    hobbyId
                });

                console.log('Post added successfully.');
                res.send(result.insertedId);
                res.end();
                return;

            } else {
                res.status(404);
                res.send("Wrong input data.");
                res.end();
                return;
            }
        } catch (error) {
            console.error("Failed to create the post; ", error);
        }

    });

    app.delete('/posts', async (req, res) => {
        const { postId } = req.query;
        if (typeof postId === 'string') {
            try {
                const deleteRes = await postsCollection.deleteOne({
                    _id: new ObjectId(postId)
                });
                res.status(200).end();
                return;

            } catch (error) {
                console.error("Failed to delete the post: ", error);
                res.status(400).end();
                return;

            }
        } else {
            console.error("PostId query paramter is invalid.");
            console.error("PostId: ", postId);
            res.status(400).end();
        }
    })

}