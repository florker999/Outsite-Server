export default interface ISignupResponse {
    userSub: string,
    isUserConfirmed: boolean,
    confirmation: {
        destination: string,
        medium: string
    },
    confirmData: {
        username: string,
        session: string
    }
}