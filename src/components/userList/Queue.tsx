import React, { useContext, useState, useEffect } from "react";
import classes from "./Queue.module.less";
import { Tabs, message, Typography, Tag, Tooltip } from "antd";
import { ApiContext, IJobInfo, ScreenerStatus } from "../../api/ApiContext";
import { Keys, KeyMap, TabMap } from "./data";
import JobTable from "./JobTable";
import FeedbackModal from "./FeedbackModal";
import useInterval from "../../api/interval";

import "./UserList.less";
import { withRouter, RouteComponentProps } from "react-router-dom";

const { TabPane } = Tabs;
const { Title } = Typography;
const Queue = (props: RouteComponentProps) => {
	const context = useContext(ApiContext);
	const [selectedJob, setSelectedJob] = useState<IJobInfo | null>(null);
	const [isModalOpen, setModalOpen] = useState(false);
	const [filterType, setFilterType] = useState(2);

	useEffect(() => {
		if (!selectedJob) {
			setModalOpen(false);
		}
	}, [selectedJob]);

	useInterval(() => {
		if (context?.userIsLoggedIn && !context?.isSocketConnected) {
			getJobsCall();
		}
	}, 1000);

	if (!context) {
		return null;
	}

	const {
		postChangeStatusCall,
		getJobsCall,
		handleRemoveJob,
		studentData,
		user,
	} = context;

	const startVideoCall = () => {
		if (!selectedJob) {
			return;
		}

		const job: IJobInfo = { ...selectedJob, status: "active" };
		postChangeStatusCall(job.data, "SET_ACTIVE")
			.then((_newJob: IJobInfo) => {
				setModalOpen(false);
				const room = new URL(job.data.jitsi).pathname;
				props.history.push(`screening/${job.data.email}${room}`);
				message.success("Der Student wurde zum VideoCall eingeladen.");
			})
			.catch((_err: any) => {
				setSelectedJob(null);
				setModalOpen(false);
				message.error("Der VideoCall konnte nicht gestartet werden.");
			});
	};

	const completeJob = (job: IJobInfo, isVerified: boolean) => {
		setModalOpen(false);
		setFilterType(isVerified ? 4 : 5);

		postChangeStatusCall(job.data, isVerified ? "SET_DONE" : "SET_REJECTED")
			.then(() => message.success("Änderungen wurden erfolgreich gespeichert."))
			.catch(() =>
				message.error("Änderungen konnten nicht gespeichert werden")
			);
	};

	const handleColumnClick = (job: IJobInfo) => {
		if (job.status !== "waiting") {
			setSelectedJob(job);
			setModalOpen(true);
			return;
		}

		if (!job) {
			return;
		}

		setSelectedJob(job);
		setModalOpen(true);
	};

	const data = studentData
		.map((data, index) => ({ key: index, ...data }))
		.filter((data) => {
			if (filterType !== 1) {
				return data.status === KeyMap.get(filterType)?.toLowerCase();
			}
			return true;
		})
		.sort((a, b) => a.timeWaiting - b.timeWaiting)
		.filter((job) => {
			if (
				job.status !== "waiting" &&
				job.status !== "active" &&
				job.assignedTo
			) {
				return job.assignedTo.email === user?.email;
			}
			return true;
		});

	const renderStatus = () => {
		if (context.status === ScreenerStatus.ONLINE) {
			return (
				<Tooltip
					title="Du bist mit dem Backend verbunden und bekommst Live updates."
					placement="left">
					<Tag color="green">Live</Tag>
				</Tooltip>
			);
		}
		if (context.status === ScreenerStatus.OFFLINE) {
			return (
				<Tooltip
					title="Deine Verbindung ist abgebrochen. Bitte lade die Seite neu!"
					placement="left">
					<Tag color="red">Offline</Tag>
				</Tooltip>
			);
		}
		if (context.status === ScreenerStatus.RECONNECTING) {
			return (
				<Tooltip
					title="Deine Verbindung wird wiederhergestellt."
					placement="left">
					<Tag color="orange">Reconnecting...</Tag>
				</Tooltip>
			);
		}
	};

	return (
		<div className={classes.queue}>
			<div className={classes.header}>
				<Title style={{ color: "#6c757d", marginTop: 0 }} level={4}>
					Warteschlange
				</Title>
				{renderStatus()}
			</div>
			<Tabs
				defaultActiveKey={`${filterType}`}
				activeKey={`${filterType}`}
				onChange={(key) => {
					setFilterType(parseInt(key));
				}}>
				{Keys.map((index) => {
					return (
						<TabPane tab={TabMap.get(index)} key={index.toString()}>
							<JobTable
								reverse={filterType === 2 ? false : true}
								handleRemoveJob={handleRemoveJob}
								allJobs={studentData}
								data={data}
								handleColumnClick={handleColumnClick}
								user={user}
							/>
						</TabPane>
					);
				})}
			</Tabs>
			{selectedJob && (
				<FeedbackModal
					removeJob={context.handleRemoveJob}
					isModalOpen={isModalOpen}
					closeModal={() => setModalOpen(false)}
					completeJob={completeJob}
					startVideoCall={startVideoCall}
					selectedJob={selectedJob}
					setSelectedJob={(job: IJobInfo) => setSelectedJob(job)}
				/>
			)}
		</div>
	);
};

export default withRouter(Queue);
