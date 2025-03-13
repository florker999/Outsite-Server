import { ObjectId } from "mongodb";

export default function checkAndCreateObjectId(value: any) {
    if (ObjectId.isValid(value)) {
        return new ObjectId(value);
    } else {
        throw Error("Invalid object id.");
    }
}