import { ArrowLeftOutlined, UserOutlined } from "@ant-design/icons";
import { PageContainer } from "@ant-design/pro-components";
// 扩展Form.ItemProps类型以包含render属性
import { useIntl, useNavigate, useParams, useSearchParams } from "@umijs/max";
import { Button, Card, Form, Input, message, Spin, Tag } from "antd";
import React, { useEffect, useState } from "react";
import { getUserinfos } from "@/services/uniauthService/userInfo";

interface UserDetailData {
  upn: string;
  email: string;
  displayName: string;
  schoolStatus: string;
  identityType: string;
  employeeId: string;
  name: string;
  tags: string[];
  department: string;
  title: string;
  office: string;
  officePhone: string;
  employeeType: string;
  fundingTypeOrAdmissionYear: string;
  studentCategoryPrimary: string;
  studentCategoryDetail: string;
  studentNationalityType: string;
  residentialCollege: string;
  staffRole: string;
  samAccountName: string;
  mailNickname: string;
  createdAt: string;
  updatedAt: string;
}

const UserDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const intl = useIntl();
  const [searchParams] = useSearchParams();
  const [userData, setUserData] = useState<UserDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [form] = Form.useForm();
  // 使用message实例代替静态方法，避免主题上下文警告
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!id) {
        messageApi.error("用户ID缺失");
        setLoading(false);
        setError("用户ID缺失");
        return;
      }

      setLoading(true);
      setError("");

      try {
        console.log("开始获取用户详情，ID:", id);

        // 构建请求参数
        const requestParams = {
          upn: id,
          verbose: true,
        };

        // 调用API获取用户详情
        const response = await getUserinfos(requestParams);

        console.log("用户详情API响应:", response);

        // 增强错误边界检查
        if (!response || typeof response !== "object") {
          console.error("API返回格式错误", response);
          messageApi.error("获取用户信息失败：返回数据格式错误");
          setUserData(null);
          setError("获取用户信息失败：返回数据格式错误");
          return;
        }

        // 检查是否包含必要字段
        const hasNecessaryFields = response.upn !== undefined;

        if (hasNecessaryFields) {
          // 确保数据完整性，为缺失字段提供默认值
          const userDataWithDefaults = {
            upn: response.upn || "",
            email: response.email || "",
            displayName: response.displayName || "",
            schoolStatus: response.schoolStatus || "",
            identityType: response.identityType || "",
            employeeId: response.employeeId || "",
            name: response.name || "",
            tags: Array.isArray(response.tags) ? response.tags : [],
            department: response.department || "",
            title: response.title || "",
            office: response.office || "",
            officePhone: response.officePhone || "",
            employeeType: response.employeeType || "",
            fundingTypeOrAdmissionYear:
              response.fundingTypeOrAdmissionYear || "",
            studentCategoryPrimary: response.studentCategoryPrimary || "",
            studentCategoryDetail: response.studentCategoryDetail || "",
            studentNationalityType: response.studentNationalityType || "",
            residentialCollege: response.residentialCollege || "",
            staffRole: response.staffRole || "",
            samAccountName: response.samAccountName || "",
            mailNickname: response.mailNickname || "",
            createdAt: response.createdAt || "",
            updatedAt: response.updatedAt || "",
          };

          setUserData(userDataWithDefaults);
          messageApi.success("获取用户信息成功");
        } else {
          messageApi.error("未找到用户信息");
          setUserData(null);
          setError("未找到用户信息");
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "未知错误";
        console.error("获取用户信息失败:", error);
        messageApi.error(`获取用户信息失败: ${errorMsg}`);
        setUserData(null);
        setError(`获取用户信息失败: ${errorMsg}`);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id, form]);

  const handleBack = () => {
    // 从URL参数中读取之前的搜索状态
    const fromKeyword = searchParams.get("from_keyword");
    const fromCurrent = searchParams.get("from_current");
    const fromPageSize = searchParams.get("from_pageSize");

    // 构建返回的URL参数
    const backParams = new URLSearchParams();
    if (fromKeyword) backParams.set("keyword", fromKeyword);
    if (fromCurrent) backParams.set("current", fromCurrent);
    if (fromPageSize) backParams.set("pageSize", fromPageSize);

    // 构建完整的返回URL
    const backUrl = `/user-list${backParams.toString() ? `?${backParams.toString()}` : ""}`;

    // 导航到用户列表页面并恢复搜索状态
    navigate(backUrl);
  };

  // 直接渲染表单字段，避免类型推断问题
  const renderFormFields = () => {
    if (!userData) return null;

    // 为每个字段定义附加说明
    const fieldDescriptions = {
      upn: "唯一。用户名@cuhk.edu.cn 或 学号@link.cuhk.edu.cn。用户登录名。",
      email: "唯一。用户名@cuhk.edu.cn。",
      displayName: "显示名。",
      schoolStatus:
        "当前在校状态：Employed | Dimission | In-School | Graduation | Withdraw | Emeritus。",
      identityType: "身份类型：Fulltime | CO | Student | Parttime。",
      employeeId: "唯一。6位员工编号或9/10位学号。",
      name: "唯一。全名。",
      tags: "用户标签。",
      department: "部门信息。",
      title: "职务名称。",
      office: "办公地点。",
      officePhone: "办公室电话。",
      employeeType: "员工类型。",
      fundingTypeOrAdmissionYear:
        "教职员经费类型（uni/researchPro/Other）或学生4位入学年份",
      studentCategoryPrimary: "Postgraduate/Undergraduate 研究生/本科生",
      studentCategoryDetail: "Master/Ph.D./Undergraduate 硕士/博士/本科",
      studentNationalityType:
        "Local/Exchange/International/CUCDMP/HMT 本地/交换/国际/本部/港澳台",
      residentialCollege: "书院缩写（如SHAW）",
      staffRole:
        "Teaching/Admin/VisitingStudent/Alumni/Other 教学/行政/访问学生/校友/其他",
      samAccountName: "Windows账户名。",
      mailNickname: "邮箱别名。",
      createdAt: "记录创建时间。",
      updatedAt: "记录最后更新时间。",
    };

    const renderField = (key: keyof UserDetailData, labelKey: string) => {
      const value = userData[key] || "-";

      // 特殊处理tags字段，使用Tag组件
      if (key === "tags") {
        const tags = Array.isArray(userData.tags) ? userData.tags : [];
        // 标签颜色数组
        const colors = [
          "magenta",
          "red",
          "volcano",
          "orange",
          "gold",
          "lime",
          "green",
          "cyan",
          "blue",
          "geekblue",
          "purple",
        ];

        return (
          <Form.Item
            key={key}
            label={intl.formatMessage({ id: labelKey })}
            tooltip={fieldDescriptions[key as keyof typeof fieldDescriptions]}
            style={{ marginBottom: "16px" }}
          >
            <div
              style={{
                width: "100%",
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              {tags.length > 0 ? (
                tags.map((tag, index) => {
                  const color = colors[index % colors.length];
                  return (
                    <Tag key={`tag-${tag}`} color={color}>
                      {tag}
                    </Tag>
                  );
                })
              ) : (
                <Tag color="default">-</Tag>
              )}
            </div>
          </Form.Item>
        );
      }

      // 其他字段使用Input组件
      return (
        <Form.Item
          key={key}
          label={intl.formatMessage({ id: labelKey })}
          tooltip={fieldDescriptions[key as keyof typeof fieldDescriptions]}
          style={{ marginBottom: "16px" }}
        >
          <Input
            value={value}
            readOnly
            style={{
              backgroundColor: "#fafafa",
              borderColor: "#d9d9d9",
              color: "#333",
            }}
          />
        </Form.Item>
      );
    };

    return (
      <>
        {renderField("upn", "pages.userDetail.upn")}
        {renderField("email", "pages.userDetail.email")}
        {renderField("displayName", "pages.userDetail.displayName")}
        {renderField("schoolStatus", "pages.userDetail.schoolStatus")}
        {renderField("identityType", "pages.userDetail.identityType")}
        {renderField("employeeId", "pages.userDetail.employeeId")}
        {renderField("name", "pages.userDetail.name")}
        {renderField("tags", "pages.userDetail.tags")}
        {renderField("department", "pages.userDetail.department")}
        {renderField("title", "pages.userDetail.title")}
        {renderField("office", "pages.userDetail.office")}
        {renderField("officePhone", "pages.userDetail.officePhone")}
        {renderField("employeeType", "pages.userDetail.employeeType")}
        {renderField(
          "fundingTypeOrAdmissionYear",
          "pages.userDetail.fundingTypeOrAdmissionYear",
        )}
        {renderField(
          "studentCategoryPrimary",
          "pages.userDetail.studentCategoryPrimary",
        )}
        {renderField(
          "studentCategoryDetail",
          "pages.userDetail.studentCategoryDetail",
        )}
        {renderField(
          "studentNationalityType",
          "pages.userDetail.studentNationalityType",
        )}
        {renderField(
          "residentialCollege",
          "pages.userDetail.residentialCollege",
        )}
        {renderField("staffRole", "pages.userDetail.staffRole")}
        {renderField("samAccountName", "pages.userDetail.samAccountName")}
        {renderField("mailNickname", "pages.userDetail.mailNickname")}
        {renderField("createdAt", "pages.userDetail.createdAt")}
        {renderField("updatedAt", "pages.userDetail.updatedAt")}
      </>
    );
  };

  return (
    <>
      {contextHolder}
      <PageContainer>
        <div style={{ marginBottom: 16 }}>
          <Button
            type="default"
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
          >
            {intl.formatMessage({ id: "pages.userDetail.backToList" })}
          </Button>
        </div>

        <Card>
          {/* 加载状态 */}
          {loading ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <Spin size="large" />
              <p style={{ marginTop: 16 }}>正在加载用户详情...</p>
            </div>
          ) : // 错误状态或用户数据
          error ? (
            <div style={{ textAlign: "center", padding: 60, color: "#f5222d" }}>
              <UserOutlined style={{ fontSize: 48, marginBottom: 16 }} />
              <p style={{ fontSize: 16, marginBottom: 16 }}>{error}</p>
              <Button type="primary" onClick={() => window.location.reload()}>
                重试
              </Button>
            </div>
          ) : userData ? (
            <>
              {/* 用户基本信息概览 */}
              <div
                style={{
                  padding: 16,
                  backgroundColor: "#f5f5f5",
                  borderRadius: 8,
                  marginBottom: 24,
                }}
              >
                <h2 style={{ margin: 0, marginBottom: 8 }}>
                  {userData.displayName || userData.name || "未知用户"}
                </h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <Tag color="blue">{userData.upn}</Tag>
                  {userData.schoolStatus && (
                    <Tag
                      color={
                        userData.schoolStatus === "Employed" ||
                        userData.schoolStatus === "In-School"
                          ? "green"
                          : "orange"
                      }
                    >
                      {userData.schoolStatus}
                    </Tag>
                  )}
                  {userData.identityType && <Tag>{userData.identityType}</Tag>}
                  {userData.department && <Tag>{userData.department}</Tag>}
                </div>
              </div>

              {/* 用户详细信息表单 */}
              <Form form={form} layout="vertical" size="middle">
                {renderFormFields()}
              </Form>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: 60 }}>
              <UserOutlined
                style={{ fontSize: 48, marginBottom: 16, color: "#d9d9d9" }}
              />
              <p>无用户数据</p>
            </div>
          )}
        </Card>
      </PageContainer>
    </>
  );
};

export default UserDetail;
