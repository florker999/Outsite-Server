export default function isNotEmptyString(value: any): value is string {
    return typeof value === 'string' && value !== '';
}