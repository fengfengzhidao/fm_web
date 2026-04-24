export function formatPrice(price?: number | null): string {
    if (price === null || price === undefined) {
        return "0.00"
    }
    return (price / 100).toFixed(price % 100 === 0 ? 0 : 2)
}

export function orderStatusText(status: number): string {
    const map: Record<number, string> = {
        1: "待付款",
        2: "已付款",
        3: "待收货",
        4: "已收货",
        5: "待评价",
        6: "已评价",
        7: "已取消",
        8: "超时",
    }
    return map[status] || `状态 ${status}`
}

export function orderStatusColor(status: number): "blue" | "green" | "orange" | "red" | "gray" {
    if (status === 1) return "blue"
    if (status === 2 || status === 4 || status === 6) return "green"
    if (status === 3 || status === 5) return "orange"
    if (status === 7 || status === 8) return "red"
    return "gray"
}

export function canPayOrder(status: number): boolean {
    return status === 1
}

export function canReceiveOrder(status: number): boolean {
    return status === 3
}

export function canCommentOrder(status: number): boolean {
    return status === 4 || status === 5
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
