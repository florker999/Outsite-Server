export default function isNotEmptyString(hobbyName: any): hobbyName is string {
    return typeof hobbyName === 'string' && hobbyName !== '';
}