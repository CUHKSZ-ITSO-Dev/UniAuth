import { FullscreenExitOutlined } from "@ant-design/icons";
import { Button, Modal } from "antd";
import React from "react";
import type { JsonEditorProps } from "./index";

// 全屏模态框组件的属性接口
interface FullscreenModalProps extends JsonEditorProps {
  visible: boolean;
  onClose: () => void;
}

// 全屏模态框组件
const FullscreenModal: React.FC<FullscreenModalProps> = ({
  visible,
  onClose,
}) => {
  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose} icon={<FullscreenExitOutlined />}>
          退出全屏
        </Button>,
      ]}
      width="90vw"
      style={{ top: 20 }}
      styles={{
        body: {
          height: "80vh",
          display: "flex",
          flexDirection: "column",
        },
      }}
      destroyOnHidden
    >
      <div style={{ flex: 1, overflow: "hidden" }}>
        {/* 全屏模式下的内容容器 */}
        <div style={{ padding: "20px" }}>
          {/* JsonEditor组件将在此处渲染 */}
        </div>
      </div>
    </Modal>
  );
};

export default FullscreenModal;
