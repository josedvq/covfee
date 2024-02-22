import React from "react";
import { DownOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Dropdown, Menu, Space, MenuInfo } from "antd";

interface AnnotationTypeDropdownProps {
  annotation_types: string[];
  itemClick: (item: string) => void;
  selected_annotation: string;
}

export const AnnotationTypeDropdown: React.FC<AnnotationTypeDropdownProps> = ({
  annotation_types,
  itemClick,
  selected_annotation,
}) => {
  console.log("Selected annotation:" + selected_annotation);
  const items: MenuProps["items"] = [
    {
      key: "1",
      type: "group",
      label: "Action Annotations",
      children: annotation_types.map((annotation_type) => ({
        key: annotation_type,
        label: annotation_type,
        onClick: (item: MenuInfo) => {
          itemClick(item.key);
        },
      })),
    },
  ];

  return (
    <Dropdown menu={{ items }}>
      <a
        onClick={(e) => {
          e.preventDefault();
        }}
      >
        <Space>
          {selected_annotation}
          <DownOutlined />
        </Space>
      </a>
    </Dropdown>
  );
};

export default AnnotationTypeDropdown;
