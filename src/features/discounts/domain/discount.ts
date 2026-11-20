export type DiscountKind = 'percentage' | 'fixed_amount'

export type Discount = {
  id: number
  name: string
  nameEs: string
  kind: DiscountKind
  amount: number
  roleIds: number[]
}

export type DiscountInput = Omit<Discount, 'id'>
export type DiscountRole = { id: number; name: string }
