import { FullscreenExitOutlined } from "@ant-design/icons";
import { Button, Modal } from "antd";
import React from "react";
import type { JsonEditorProps } from "./index";

interface FullscreenModalProps extends JsonEditorProps {
  visible: boolean;
  onClose: () => void;
}

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
      destroyOnClose
    >
      <div style={{ flex: 1, overflow: "hidden" }}>
        {/* 这里将渲染JsonEditor组件 */}
        <div style={{ padding: "20px" }}>
          {/* JsonEditor will be rendered here */}
        </div>
      </div>
    </Modal>
  );
};

export default FullscreenModal;
