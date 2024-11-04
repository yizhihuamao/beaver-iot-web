import { useEffect, useRef } from 'react';
import { isNil } from 'lodash-es';
import { useTheme } from '@milesight/shared/src/hooks';
import { Tooltip } from '../../../view-components';
import Chart from './gauge';
import { useSource } from './hooks';
import type { ViewConfigProps } from '../typings';
import './style.less';

interface Props {
    config: ViewConfigProps;
}
const DEFAULT_RANGE = 10;
const View = (props: Props) => {
    const { config } = props;
    const { entity, title, time, metrics } = config || {};
    const chartRef = useRef<HTMLCanvasElement>(null);
    const { blue, grey } = useTheme();
    const { aggregateHistoryData } = useSource({ entity, metrics, time });

    /** 渲染仪表图 */
    const renderGaugeChart = (datasets: {
        minValue?: number;
        maxValue?: number;
        currentValue: number;
    }) => {
        const ctx = chartRef.current!;
        if (!ctx) return;

        // 换成成符合条件的数据
        const { minValue: min, maxValue: max, currentValue: value } = datasets || {};
        const currentValue = value || 0;
        const minValue = min || 0;
        const maxValue = max ? Math.max(max, currentValue) : Math.max(currentValue, DEFAULT_RANGE);
        let data = [...new Set([currentValue, maxValue])].filter(v => !isNil(v)) as number[];
        if (data.length === 1 && data[0] === 0) {
            // 没有数据时，展示为空状态
            data = [0, DEFAULT_RANGE];
        }
        const diff = maxValue - minValue;
        const tickCount = Math.floor(diff) > 1 ? diff : DEFAULT_RANGE;

        // 渲染图表
        const circumference = 216; // 定义仪表盘的周长
        const rotation = (360 - 216) / 2 + 180; // 根据周长，计算旋转的角度
        const chart = new Chart(ctx, {
            type: 'gauge',
            data: {
                datasets: [
                    {
                        data,
                        minValue,
                        value: currentValue,
                        backgroundColor: [blue[700], grey[100]],
                    },
                ],
            },
            options: {
                cutout: '90%', // 通过设置 cutout 属性调整圆环宽度，值越大圆环越细
                needle: {
                    radiusPercentage: 1.5,
                    widthPercentage: 3,
                    lengthPercentage: 80,
                    color: blue[600],
                },
                circumference,
                rotation,
                valueLabel: {
                    fontSize: 20,
                    display: true,
                    formatter: null,
                    color: grey[700],
                    bottomMarginPercentage: -20,
                },
                hover: {
                    // @ts-ignore
                    mode: null, // 禁用悬停效果
                },
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        enabled: true,
                        filter: tooltipItem => tooltipItem.dataIndex === 0, // 只显示第一个数据项的 tooltip
                        callbacks: {
                            label: context => {
                                const { raw, dataset } = context || {};
                                const label = dataset.label || '';

                                return `${label} ${raw}`;
                            },
                        },
                    },
                },
                ticks: {
                    tickCount,
                },
            },
        });
        return () => chart?.destroy();
    };

    useEffect(() => {
        if (!aggregateHistoryData) {
            return renderGaugeChart({ minValue: 0, maxValue: 0, currentValue: 0 });
        }
        const { value } = aggregateHistoryData || {};

        const { rawData } = entity || {};
        const { entityValueAttribute } = rawData || {};
        const { min, max } = entityValueAttribute || {};
        const getNumData = (value: unknown) => (Number.isNaN(Number(value)) ? 0 : Number(value));

        const currentValue = getNumData(value);
        const minValue = getNumData(min);
        const maxValue = getNumData(max);
        return renderGaugeChart({ minValue, maxValue, currentValue });
    }, [aggregateHistoryData]);

    return (
        <div className="ms-gauge-chart">
            <Tooltip className="ms-gauge-chart__header" autoEllipsis title={title} />
            <div className="ms-gauge-chart__content">
                <canvas id="gaugeChart" ref={chartRef} />
            </div>
        </div>
    );
};

export default View;
