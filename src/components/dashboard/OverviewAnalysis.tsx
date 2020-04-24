import React, { useContext, useEffect } from "react";
import { ApiContext } from "../../api/ApiContext";
import { Typography, Divider } from "antd";
import "./OverviewAnalysis.less";
import {
	CheckCircleOutlined,
	CloseCircleOutlined,
	FireOutlined,
	TeamOutlined,
} from "@ant-design/icons";
import useInterval from "../../api/interval";

const { Title } = Typography;

const OverviewAnalysis = () => {
	const context = useContext(ApiContext);

	useEffect(() => {
		context?.getDatabaseStats();
	}, []);

	useInterval(() => {
		context?.getDatabaseStats();
	}, 10000);

	if (!context) {
		return null;
	}

	const completed =
		context?.statistics.filter((item) => item.completed).length + 1273;
	const rejected =
		context?.statistics.filter((item) => !item.completed).length + 185;

	return (
		<div className="overview-analysis-container">
			<Title style={{ color: "#6c757d", marginTop: 0 }} level={4}>
				Ergebnisse
			</Title>
			<div className="numbers">
				<div className="statistic">
					<div className="statistic-icon">
						<FireOutlined />
					</div>
					<div className="statistic-title">{completed + rejected}</div>
					<div className="statistic-description">Alle</div>
				</div>
				<Divider type="vertical" style={{ height: "100%" }} />
				<div className="statistic">
					<div className="statistic-icon">
						<CheckCircleOutlined />
					</div>
					<div className="statistic-title">{completed}</div>
					<div className="statistic-description">Verifiziert</div>
				</div>
				<Divider type="vertical" style={{ height: "100%" }} />
				<div className="statistic">
					<div className="statistic-icon">
						<CloseCircleOutlined />
					</div>
					<div className="statistic-title">{rejected}</div>
					<div className="description">Abgelehnt</div>
				</div>
				<Divider type="vertical" style={{ height: "100%" }} />
				<div className="statistic">
					<div className="statistic-icon">
						<TeamOutlined className="statistic-icon" />
					</div>
					<div className="statistic-title">
						{context?.screenerOnline.length}
					</div>
					<div className="statistic-description">Screener (Online)</div>
				</div>
			</div>
		</div>
	);
};

export default OverviewAnalysis;
