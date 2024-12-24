import { Suspense, useCallback, useRef } from 'react';
import {
    DeleteOutlineIcon as DeleteOutline,
    EditOutlinedIcon as EditOutlined,
} from '@milesight/shared/src/components';
import plugins from '@/plugin/plugins';
import { RenderView } from '@/plugin/render';
import { WidgetDetail } from '@/services/http/dashboard';

interface WidgetProps {
    data: WidgetDetail;
    isEdit: boolean;
    onEdit: (data: WidgetDetail) => void;
    onDelete: (data: WidgetDetail) => void;
    mainRef: any;
}

const Widget = (props: WidgetProps) => {
    const { data, isEdit, onEdit, onDelete, mainRef } = props;
    const ComponentView = (plugins as any)[`${data.data.type}View`];
    const widgetRef = useRef<HTMLDivElement>(null);

    const handleEdit = useCallback(() => {
        onEdit(data);
    }, [data]);

    const handleDelete = useCallback(() => {
        onDelete(data);
    }, [data]);
    // console.log(plugins, data.data.type, (plugins as any)[`${data.data.type}`]);
    return (
        <div className="dashboard-content-widget">
            {isEdit && (
                <div
                    className={`dashboard-content-widget-icon ${isEdit ? 'dashboard-content-widget-icon-edit' : ''}`}
                >
                    <span className="dashboard-content-widget-icon-img" onClick={handleEdit}>
                        <EditOutlined />
                    </span>
                    <span className="dashboard-content-widget-icon-img" onClick={handleDelete}>
                        <DeleteOutline />
                    </span>
                </div>
            )}
            {!(plugins as any)[`${data.data.type}`] ? (
                ComponentView ? (
                    <div ref={widgetRef} className="dashboard-content-widget-main">
                        <Suspense>
                            <ComponentView
                                config={data.data.config}
                                configJson={data.data}
                                isEdit={isEdit}
                                mainRef={mainRef}
                            />
                        </Suspense>
                        {isEdit && (
                            <span
                                className="dashboard-custom-resizable-handle dashboard-custom-resizable-handle-se"
                                onClick={(e: any) => e.stopPropagation()}
                            />
                        )}
                    </div>
                ) : (
                    <div ref={widgetRef} className="dashboard-content-widget-main">
                        <RenderView configJson={data.data as any} config={data.data.config} />
                        {isEdit && (
                            <span
                                className="dashboard-custom-resizable-handle dashboard-custom-resizable-handle-se"
                                onClick={(e: any) => e.stopPropagation()}
                            />
                        )}
                    </div>
                )
            ) : (
                <div>11</div>
            )}
        </div>
    );
};

export default Widget;
