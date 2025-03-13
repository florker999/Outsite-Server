export default interface ICreateTrophyRequest {
    hobbyId: string,
    trophy: {
        title: string,
        description: string,
        iconType: string,
    }
}