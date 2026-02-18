import { Wall } from '../../../application/types'
import { WallConstruction } from '../WallTypes'
import { BOQItem } from '@/core/engine/boq-calculators/types'

export interface IOpeningDimensions {
    width: number
    height: number
    type: string
}

export interface IWallBOQStrategy {
    calculate(wall: Wall, construction: WallConstruction, openings: IOpeningDimensions[]): BOQItem[]
}
