export default interface ICreatePostRequest {
    hobbyId: string,
    post: {
        title: string,
        content: string,
    }
}