import { useEffect, useRef } from 'react';
import { useRequest } from 'ahooks';
import Chart from 'chart.js/auto'; // 引入 Chart.js
import { useI18n } from '@milesight/shared/src/hooks';
import { awaitWrap, entityAPI, getResponseData, isRequestSuccess } from '@/services/http';
import { ViewConfigProps } from '../typings';
import './style.less';

interface IProps {
    config: ViewConfigProps;
}
const View = (props: IProps) => {
    const { config } = props;
    const { entityList, title, metrics, time } = config || {};
    const { getIntlText } = useI18n();
    const chartRef = useRef<HTMLCanvasElement>(null);

    const { data: aggregateHistoryList } = useRequest(
        async () => {
            if (!entityList || entityList.length === 0) return;

            const run = async (entityId: ApiKey) => {
                const now = Date.now();
                const [error, resp] = await awaitWrap(
                    entityAPI.getAggregateHistory({
                        entity_id: entityId,
                        aggregate_type: metrics,
                        start_timestamp: now - time,
                        end_timestamp: now,
                    }),
                );
                if (error || !isRequestSuccess(resp)) return;

                return getResponseData(resp);
            };
            const fetchList = entityList.map(entity => {
                const { value: entityId } = entity || {};
                if (!entityId) return;

                return run(entityId);
            });
            return Promise.all(fetchList.filter(Boolean));
        },
        { refreshDeps: [entityList, title, time, metrics] },
    );

    useEffect(() => {
        const ctx = chartRef.current!;
        if (!ctx) return;

        const chart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: [
                    'Eating',
                    'Drinking',
                    'Sleeping',
                    'Designing',
                    'Coding',
                    'Cycling',
                    'Running',
                ],
                datasets: [
                    {
                        label: 'My First Dataset',
                        data: [65, 59, 90, 81, 56, 55, 40],
                        fill: true,
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgb(255, 99, 132)',
                        pointBackgroundColor: 'rgb(255, 99, 132)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgb(255, 99, 132)',
                    },
                    {
                        label: 'My Second Dataset',
                        data: [28, 48, 40, 19, 96, 27, 100],
                        fill: true,
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgb(54, 162, 235)',
                        pointBackgroundColor: 'rgb(54, 162, 235)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgb(54, 162, 235)',
                    },
                ],
            },
            options: {
                elements: {
                    line: {
                        borderWidth: 3,
                    },
                },
            },
        });

        return () => {
            /**
             * 清空图表数据
             */
            chart.destroy();
        };
    }, []);

    const headerLabel = title || getIntlText('common.label.title');
    return (
        <div className="ms-radar-chart">
            <div className="ms-radar-chart__header">{headerLabel}</div>
            <canvas id="radarChart" ref={chartRef} />
        </div>
    );
};

export default View;
