import { useEffect } from 'react';
import Chart from 'chart.js/auto'; // 引入 Chart.js
import { useBasicChartEntity } from '@/plugin/hooks';
import { Tooltip } from '@/components';
import styles from './style.module.less';

export interface ViewProps {
    config: {
        entity?: EntityOptionType[];
        title?: string;
        time: number;
    };
    configJson: {
        isPreview?: boolean;
    };
}

const View = (props: ViewProps) => {
    const { config, configJson } = props;
    const { entity, title, time } = config || {};
    const { isPreview } = configJson || {};
    const { chartShowData, chartLabels, chartRef } = useBasicChartEntity({
        entity,
        time,
        isPreview,
    });

    useEffect(() => {
        let chart: Chart<'line', (string | number | null)[], string> | null = null;
        if (chartRef.current) {
            chart = new Chart(chartRef.current, {
                type: 'line',
                data: {
                    labels: chartLabels,
                    datasets: chartShowData.map(chart => ({
                        label: chart.entityLabel,
                        data: chart.entityValues,
                        borderWidth: 1,
                        spanGaps: true,
                    })),
                },
                options: {
                    responsive: true, // 使图表响应式
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                        },
                    },
                },
            });
        }

        return () => {
            /**
             * 清空图表数据
             */
            chart?.destroy();
        };
    }, [chartLabels, chartShowData, chartRef]);

    return (
        <div className={styles['line-chart-wrapper']}>
            <Tooltip className={styles.name} autoEllipsis title={title} />
            <div className={styles['line-chart-content']}>
                <canvas ref={chartRef} />
            </div>
        </div>
    );
};

export default View;
