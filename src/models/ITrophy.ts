export default interface ITrophy {
    title: string,
    description: string,
    isGained: boolean,
    iconType: TIconType,
    hobbyId: string,
}

export type TIconType = 'plane' | 'bike';