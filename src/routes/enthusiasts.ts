import Express from "express";
import ICreateEnthusiastRequest from "../models/ICreateEnthusiastRequest.js";
import isNotEmptyString from "../utils/isNotEmptyString.js";
import { Db } from "mongodb";
import { AuthFlowType, CognitoIdentityProviderClient, ConfirmSignUpCommand, GetUserCommand, InitiateAuthCommand, ListUsersCommand, ResendConfirmationCodeCommand, SignUpCommand } from "@aws-sdk/client-cognito-identity-provider";
import crypto from 'node:crypto';
import { IConfirmSignUpRequest } from "../models/IConfirmSignUpRequest.js";
import ILoginResponse from "../models/ILoginResponse.js";
import ISignupResponse from "../models/ISignupResponse.js";
import AWS from "aws-sdk";

export default function launchRoute(app: Express.Application, outsiteDb: Db) {

    app.post('/login', async (req, res) => {
        console.log("Entered Login route, sid: " + req.sessionID);

        const { username, password } = req.body;
        const clientId: string = "69jsmdkbec8dn150mi19r22nab";

        // const nonce = generators.nonce();
        // const state = generators.state();

        // req.session.nonce = nonce;
        // req.session.state = state;

        try {
            console.log("Login: Trying to authenticate.");
            const authRes = await initiateAuth({ username, password, clientId });

            console.log("Login: Getting user sub.");
            const getUserRes = await getUser(authRes.AuthenticationResult?.AccessToken!);
            const userSub = getUserRes.UserAttributes?.find(attribute => attribute.Name === 'sub')?.Value;
            if (userSub) {
                const responseObject: ILoginResponse = {
                    session: authRes.Session,
                    userSub
                }
                console.log("Login: Sending back data.");
                res.status(200).send(responseObject).end();
                return;

            }
        } catch (error) {
            console.error("Failed to login: ", error);
        }
        res.sendStatus(400);
        return;
    });

    /*     app.get('/checkUsernameAvailability', async (req, res) => {
            console.log("Entered CheckUsernameAvailability route, sid: " + req.sessionID);
    
            const { username } = req.query;
            if (typeof username === 'string' && username) {
                try {
                    console.log("Checking username availability...");
    
                    const checkRes = await checkUsernameAvailability(username);
                    if (checkRes.Users && checkRes.Users.length > 0) {
                        console.log("Username unavailable.");
                        res.send(false);
                        res.status(200);
                        res.end();
                        return;
    
                    } else {
                        console.log("Username available.");
                        res.send(true);
                        res.status(200);
                        res.end();
                        return;
                    }
                } catch (error) {
                    console.log("Failed to check the availability: ", error);
                    res.sendStatus(400);
                    res.end();
                    return;
    
                }
            }
        })
     */
    app.post('/signUp', async (req, res) => {
        console.log("Entered SignUp route, sid: " + req.sessionID);

        const { email, username, password }: ICreateEnthusiastRequest = req.body;
        const signUpDataAreValid = validateSignUpData(email, username, password);

        if (!signUpDataAreValid) {
            res.status(404);
            res.send("Wrong input data.");
            return;

        }

        const clientId: string = "69jsmdkbec8dn150mi19r22nab";

        try {
            console.log("Trying to signup...");
            const signUpRes = await signUp({ clientId, username, password, email });
            console.log("Success!");

            if (signUpRes.UserSub && signUpRes.UserConfirmed !== undefined && signUpRes.CodeDeliveryDetails?.Destination && signUpRes.CodeDeliveryDetails?.DeliveryMedium) {
                const responseObject: ISignupResponse = {
                    userSub: signUpRes.UserSub,
                    isUserConfirmed: signUpRes.UserConfirmed,
                    confirmation: {
                        destination: signUpRes.CodeDeliveryDetails?.Destination,
                        medium: signUpRes.CodeDeliveryDetails?.DeliveryMedium
                    },
                    confirmData: {
                        username,
                        session: signUpRes.Session!
                    }
                }
                console.log("Sending data back.");
                res.send(responseObject);
                res.status(200);
                res.end();
                return;
            }

        } catch (error) {
            if (error instanceof Error) {
                if (error.name === "UsernameExistsException") {
                    console.log("Failed to sign up the user: username exists.");
                    res.status(400);
                    res.statusMessage = "UsernameExistsException";
                    res.end();
                    return;
                }
            }

            console.log("Failed to sign up the user: ", error);
            res.sendStatus(400);
            res.end();
            return;
        }
    });

    app.post('/confirmSignUp', async (req, res) => {
        const { code, session, username }: IConfirmSignUpRequest = req.body;
        const clientId: string = "69jsmdkbec8dn150mi19r22nab";

        try {
            console.log("Trying to confirm signup...");
            await confirmSignUp({ clientId, session, code, username });
            console.log("Success!");
            
            console.log("Sending data back.");
            res.status(200);
            res.end();
            return;

        } catch (error) {
            console.error("Failed to confirm signup: ", error);
            if (error instanceof Error) {
                res.statusMessage = error.name;
            }
            res.sendStatus(400);
            res.end();
            return;
        }
    });

    app.post('/resendCode', async (req, res) => {
        const { username }: IConfirmSignUpRequest = req.body;
        const clientId: string = "69jsmdkbec8dn150mi19r22nab";

        try {
            console.log("Trying to resend code...");
            await resendCode({ clientId, username });
            console.log("Success!");
            
            console.log("Sending data back.");
            res.status(200);
            res.end();
            return;

        } catch (error) {
            console.error("Failed to resend code: ", error);
            if (error instanceof Error) {
                res.statusMessage = error.name;
            }
            res.sendStatus(400);
            res.end();
            return;
        }
    });

    const initiateAuth = ({ username, password, clientId, session }: { username: string, password: string, clientId: string, session?: string }) => {
        const client = new CognitoIdentityProviderClient({ region: "eu-north-1" });

        let command;
        if (session) {
            command = new InitiateAuthCommand({
                AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
                AuthParameters: {
                    USERNAME: username,
                    SECRET_HASH: generateHmacBase64("8ppn74d2qjr3jedu7k4atc8cb3kgv51q8sjktis2r1s5veh6eoe", username, clientId)
                },
                ClientId: clientId,
                Session: session
            });
        } else {
            command = new InitiateAuthCommand({
                AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
                AuthParameters: {
                    USERNAME: username,
                    PASSWORD: password,
                    SECRET_HASH: generateHmacBase64("8ppn74d2qjr3jedu7k4atc8cb3kgv51q8sjktis2r1s5veh6eoe", username, clientId)
                },
                ClientId: clientId,
            });
        }

        return client.send(command);
    };

    /*     const checkUsernameAvailability = (username: string) => {
            const client = new CognitoIdentityProviderClient({ region: "eu-north-1" });
            const command = new ListUsersCommand({
                UserPoolId: "eu-north-1_bxXBLQOlb",
                AttributesToGet: ['username'],
                Limit: 1,
                Filter: `username = ${username}`
            });
    
            return client.send(command);
        };
     */

    const confirmSignUp = ({ clientId, username, session, code }: { clientId: string, username: string, session: string, code: string }) => {
        const client = new CognitoIdentityProviderClient({ region: "eu-north-1" });

        const command = new ConfirmSignUpCommand({
            ClientId: clientId,
            Username: username,
            Session: session,
            ConfirmationCode: code,
            SecretHash: generateHmacBase64("8ppn74d2qjr3jedu7k4atc8cb3kgv51q8sjktis2r1s5veh6eoe", username, clientId)
        });

        return client.send(command);
    };

    const resendCode = ({ clientId, username }: { clientId: string, username: string }) => {
        const client = new CognitoIdentityProviderClient({ region: "eu-north-1" });

        const command = new ResendConfirmationCodeCommand({
            ClientId: clientId,
            Username: username,
            SecretHash: generateHmacBase64("8ppn74d2qjr3jedu7k4atc8cb3kgv51q8sjktis2r1s5veh6eoe", username, clientId)
        });

        return client.send(command);
    };

    const signUp = async ({ clientId, username, password, email }: { clientId: string, username: string, password: string, email: string }) => {
        const client = new CognitoIdentityProviderClient({ region: "eu-north-1" });
        const command = new SignUpCommand({
            SecretHash: generateHmacBase64("8ppn74d2qjr3jedu7k4atc8cb3kgv51q8sjktis2r1s5veh6eoe", username, clientId),
            ClientId: clientId,
            Username: username,
            Password: password,
            UserAttributes: [
                { Name: "email", Value: email },
                { Name: 'nickname', Value: username }
            ],
        });

        return await client.send(command);
    };

    const getUser = (accessToken: string) => {
        const client = new CognitoIdentityProviderClient({ region: "eu-north-1" });

        const command = new GetUserCommand({
            AccessToken: accessToken
        });

        return client.send(command);
    };


    function generateHmacBase64(clientSecretKey: string, username: string, clientId: string) {
        // Concatenate Username and Client Id
        const message = username + clientId;

        // Create HMAC SHA256 hash
        const hmac = crypto.createHmac('sha256', clientSecretKey);
        hmac.update(message);

        // Convert hash to Base64
        const hashInBase64 = hmac.digest('base64');

        return hashInBase64;
    }


    /*
    app.post('/login', async (req, res) => {
        const { username, password } = req.body;
        try {
            const currentEnthusiast = await enthusiastsCollection.findOne({
                username,
                password
            });

            if (currentEnthusiast) {
                res.send(currentEnthusiast._id.toHexString());
                res.writeHead(200, { 'content-type': 'text/plain' });
                return;

            } else {
                res.sendStatus(404);
                return;
            }
        } catch (error) {
            console.error("Failed to login: ", error);
            res.sendStatus(500);

        }
    });
    */
}

function validateSignUpData(email: string, username: string, password: string) {
    return (
        isNotEmptyString(email)
        && isNotEmptyString(username)
        && isNotEmptyString(password)
    );
}