import React from 'react'
import { Group, Path, Rect, Circle, Line } from 'react-konva'

export type PlumbingFixtureType = 'bath' | 'shower' | 'basin' | 'toilet' | 'sink' | 'washing_machine' | 'source'

export interface FixtureVariant {
    id: string
    label: string
    defaultWidth: number
    defaultLength: number
    render: (width: number, length: number) => React.ReactNode
}

export const PLUMBING_VARIANTS: Record<string, FixtureVariant[]> = {
    bath: [
        {
            id: 'standard',
            label: 'Standard Bath',
            defaultWidth: 1700,
            defaultLength: 700,
            render: (w, l) => (
                <Group>
                    {/* Outer Rim */}
                    <Rect x={-w/2} y={-l/2} width={w} height={l} cornerRadius={40} fill="white" stroke="#0e7490" strokeWidth={15} />
                    {/* Inner Bowl */}
                    <Rect x={-w/2 + 50} y={-l/2 + 50} width={w - 100} height={l - 100} cornerRadius={w > l ? l/3 : w/3} fill="#ecfeff" stroke="#0e7490" strokeWidth={5} />
                    {/* Drain */}
                    <Circle x={w/2 - 100} y={0} radius={25} fill="white" stroke="#0e7490" strokeWidth={3} />
                    <Circle x={w/2 - 100} y={0} radius={15} fill="#0e7490" opacity={0.2} />
                </Group>
            )
        },
        {
            id: 'oval',
            label: 'Oval Bath',
            defaultWidth: 1700,
            defaultLength: 800,
            render: (w, l) => (
                <Group>
                    {/* Outer Oval */}
                    <Rect x={-w/2} y={-l/2} width={w} height={l} cornerRadius={l/2} fill="white" stroke="#0e7490" strokeWidth={15} />
                    {/* Inner Oval */}
                    <Rect x={-w/2 + 60} y={-l/2 + 60} width={w - 120} height={l - 120} cornerRadius={(l-120)/2} fill="#ecfeff" stroke="#0e7490" strokeWidth={5} />
                    {/* Drain */}
                    <Circle x={0} y={0} radius={25} fill="white" stroke="#0e7490" strokeWidth={3} />
                </Group>
            )
        },
        {
            id: 'corner',
            label: 'Corner Bath',
            defaultWidth: 1400,
            defaultLength: 1400,
            render: (w, l) => (
                <Group>
                     {/* Corner Shape: approximated with path or arc */}
                     <Path 
                        data={`M ${-w/2} ${-l/2} L ${w/2} ${-l/2} Q ${w/2} ${l/2} ${-w/2} ${l/2} L ${-w/2} ${-l/2} Z`}
                        fill="white" stroke="#0e7490" strokeWidth={15}
                     />
                     <Path 
                        data={`M ${-w/2 + 60} ${-l/2 + 60} L ${w/2 - 60} ${-l/2 + 60} Q ${w/2 - 60} ${l/2 - 60} ${-w/2 + 60} ${l/2 - 60} Z`}
                        fill="#ecfeff" stroke="#0e7490" strokeWidth={5}
                     />
                     {/* Seat/Shelf area */}
                     <Path data={`M ${-w/2} ${-l/2} L ${-w/2+300} ${-l/2} L ${-w/2} ${-l/2+300} Z`} fill="#ecfeff" opacity={0.5} />
                </Group>
            )
        }
    ],
    shower: [
        {
            id: 'square',
            label: 'Square Shower',
            defaultWidth: 900,
            defaultLength: 900,
            render: (w, l) => (
                <Group>
                    <Rect x={-w/2} y={-l/2} width={w} height={l} fill="white" stroke="#0e7490" strokeWidth={10} />
                    <Line points={[-w/2, -l/2, w/2, l/2]} stroke="#0e7490" strokeWidth={2} opacity={0.3} />
                    <Line points={[w/2, -l/2, -w/2, l/2]} stroke="#0e7490" strokeWidth={2} opacity={0.3} />
                    <Circle x={0} y={0} radius={40} fill="white" stroke="#0e7490" strokeWidth={5} />
                </Group>
            )
        },
        {
            id: 'rectangular',
            label: 'Rectangular Shower',
            defaultWidth: 1200,
            defaultLength: 900,
            render: (w, l) => (
                <Group>
                    <Rect x={-w/2} y={-l/2} width={w} height={l} fill="white" stroke="#0e7490" strokeWidth={10} />
                    {/* Drain at one end typically */}
                    <Circle x={w/2 - 150} y={0} radius={40} fill="white" stroke="#0e7490" strokeWidth={5} />
                    {/* Glass line indication */}
                    <Line points={[-w/2 + 20, -l/2, -w/2 + 20, l/2]} stroke="#0e7490" strokeWidth={5} opacity={0.5} />
                </Group>
            )
        },
        {
            id: 'quadrant',
            label: 'Corner Quadrant',
            defaultWidth: 900,
            defaultLength: 900,
            render: (w, l) => (
                <Group>
                    {/* Quadrant Shape */}
                    <Path 
                        data={`M ${-w/2} ${-l/2} L ${w/2} ${-l/2} Q ${w/2} ${l/2} ${-w/2} ${l/2} Z`}
                        fill="white" stroke="#0e7490" strokeWidth={10}
                    />
                     <Circle x={w/2 - 200} y={l/2 - 200} radius={40} fill="white" stroke="#0e7490" strokeWidth={5} />
                </Group>
            )
        },
        {
            id: 'walk_in',
            label: 'Walk-In Shower',
            defaultWidth: 1500,
            defaultLength: 900,
            render: (w, l) => (
                <Group>
                    {/* Tray */}
                    <Rect x={-w/2} y={-l/2} width={w} height={l} fill="#f8fafc" stroke="#94a3b8" strokeWidth={5} />
                    {/* Glass Screen */}
                    <Line points={[-w/2, -l/2, w/2 - 400, -l/2]} stroke="#0e7490" strokeWidth={15} opacity={0.8} />
                    <Circle x={w/2 - 100} y={l/2 - 100} radius={35} fill="#cbd5e1" />
                </Group>
            )
        }
    ],
    basin: [
        {
            id: 'pedestal',
            label: 'Pedestal Basin',
            defaultWidth: 550,
            defaultLength: 450,
            render: (w, l) => (
                <Group>
                    <Path 
                        data={`M ${-w/2} ${-l/2} Q ${0} ${-l/2 - 50} ${w/2} ${-l/2} L ${w/2} ${l/2-100} Q ${0} ${l/2} ${-w/2} ${l/2-100} Z`}
                        fill="white" stroke="#0e7490" strokeWidth={8}
                    />
                    <Circle x={0} y={0} radius={15} fill="#94a3b8" />
                    {/* Tap */}
                    <Rect x={-15} y={-l/2 + 20} width={30} height={40} fill="#64748b" />
                </Group>
            )
        },
        {
            id: 'countertop_round',
            label: 'Round Countertop',
            defaultWidth: 400,
            defaultLength: 400,
            render: (w) => (
                <Group>
                    <Circle radius={w/2} fill="white" stroke="#0e7490" strokeWidth={8} />
                    <Circle radius={w/2 - 40} fill="#ecfeff" stroke="#0e7490" strokeWidth={2} opacity={0.5} />
                    {/* Separate tap usually */}
                    <Circle x={0} y={-w/2 + 60} radius={20} fill="#cbd5e1" />
                </Group>
             )
        },
        {
            id: 'countertop_rect',
            label: 'Rect Countertop',
            defaultWidth: 500,
            defaultLength: 350,
            render: (w, l) => (
                <Group>
                     <Rect x={-w/2} y={-l/2} width={w} height={l} cornerRadius={20} fill="white" stroke="#0e7490" strokeWidth={8} />
                     <Rect x={-w/2+30} y={-l/2+30} width={w-60} height={l-60} cornerRadius={10} fill="#ecfeff" stroke="none" />
                     <Circle x={0} y={0} radius={15} fill="#94a3b8" />
                </Group>
            )
        }
    ],
    toilet: [
        {
             id: 'standard',
             label: 'Close Coupled',
             defaultWidth: 380,
             defaultLength: 700,
             render: (w, l) => (
                 <Group>
                     {/* Cistern */}
                     <Rect x={-w/2} y={-l/2} width={w} height={200} fill="white" stroke="#0e7490" strokeWidth={8} />
                     {/* Pan */}
                     <Path 
                        data={`M ${-w/2 + 20} ${-l/2 + 200} L ${w/2 - 20} ${-l/2 + 200} L ${w/2 - 20} ${l/2 - 150} Q ${0} ${l/2} ${-w/2 + 20} ${l/2 - 150} Z`}
                        fill="white" stroke="#0e7490" strokeWidth={8}
                     />
                 </Group>
             )
        },
        {
            id: 'wall_hung',
            label: 'Wall Hung',
            defaultWidth: 360,
            defaultLength: 550,
             render: (w, l) => (
                 <Group>
                     {/* Hidden cistern logic implies it's in wall, so just show pan */}
                     <Path 
                        data={`M ${-w/2} ${-l/2} L ${w/2} ${-l/2} L ${w/2} ${l/2 - 100} Q ${0} ${l/2} ${-w/2} ${l/2 - 100} Z`}
                        fill="white" stroke="#0e7490" strokeWidth={8}
                     />
                     {/* Box for button panel indication on wall? */}
                     <Rect x={-100} y={-l/2 - 20} width={200} height={20} fill="#cbd5e1" opacity={0.5} />
                 </Group>
             )
       }
    ],
    sink: [
        {
            id: 'single_bowl',
            label: 'Single Bowl with Drainer',
            defaultWidth: 900,
            defaultLength: 500,
            render: (w, l) => (
                <Group>
                    {/* Frame */}
                    <Rect x={-w/2} y={-l/2} width={w} height={l} fill="white" stroke="#0e7490" strokeWidth={5} cornerRadius={10} />
                    {/* Bowl */}
                    <Rect x={-w/2 + 50} y={-l/2 + 50} width={(w/2)-50} height={l - 100} cornerRadius={30} fill="#ecfeff" stroke="#0e7490" strokeWidth={5} />
                    {/* Drainer Lines */}
                    <Line points={[50, -l/2 + 80, w/2 - 50, -l/2 + 80]} stroke="#cbd5e1" strokeWidth={3} />
                    <Line points={[50, 0, w/2 - 50, 0]} stroke="#cbd5e1" strokeWidth={3} />
                    <Line points={[50, l/2 - 80, w/2 - 50, l/2 - 80]} stroke="#cbd5e1" strokeWidth={3} />
                    {/* Tap Hole */}
                    <Circle x={0} y={-l/2 + 50} radius={15} fill="#94a3b8" />
                </Group>
            )
        },
        {
            id: 'double_bowl',
            label: 'Double Bowl',
            defaultWidth: 800,
            defaultLength: 500,
            render: (w, l) => (
                <Group>
                    {/* Frame */}
                    <Rect x={-w/2} y={-l/2} width={w} height={l} fill="white" stroke="#0e7490" strokeWidth={5} cornerRadius={15} />
                    {/* Bowl 1 */}
                    <Rect x={-w/2 + 40} y={-l/2 + 40} width={340} height={l-80} cornerRadius={30} fill="#ecfeff" stroke="#0e7490" strokeWidth={5} />
                    {/* Bowl 2 */}
                    <Rect x={w/2 - 380} y={-l/2 + 40} width={340} height={l-80} cornerRadius={30} fill="#ecfeff" stroke="#0e7490" strokeWidth={5} />
                </Group>
            )
        }
    ]
}
