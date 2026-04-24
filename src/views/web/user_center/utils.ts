export function formatPrice(price?: number | null): string {
    if (price === null || price === undefined) {
        return "0.00"
    }
    return (price / 100).toFixed(price % 100 === 0 ? 0 : 2)
}

export function orderStatusText(status: number): string {
    return `状态 ${status}`
}

export function userCouponStatusText(status: number): string {
    if (status === 2) {
        return "未使用"
    }
    if (status === 3) {
        return "已使用"
    }
    if (status === 4) {
        return "已过期"
    }
    return `状态 ${status}`
}

export function commentLevelText(level: number): string {
    if (level >= 4) {
        return "好评"
    }
    if (level === 3) {
        return "中评"
    }
    return "差评"
}
