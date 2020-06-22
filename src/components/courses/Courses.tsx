import React, {useCallback, useState} from "react";
import {Button, Tabs, Table, Tag, Space, Card, Descriptions, Input, Modal, Dropdown, Menu} from "antd";
import Title from "antd/lib/typography/Title";
import { ArrowLeftOutlined, FileTextOutlined, CalendarOutlined, UserOutlined, ReadOutlined, EditOutlined, ArrowDownOutlined, DownOutlined } from "@ant-design/icons/lib";
import ClipLoader from "react-spinners/ClipLoader";

import "./Courses.less";
import { CourseState, Course, ApiCourseUpdate, CourseCategory } from "../../types/Course";

import useCourses from "../../api/useCourses";
import { Student } from "../../api";
import index from "../screening";


const { TextArea } = Input;

const courseStates: { [key in CourseState]: string } = {
    submitted: "Prüfen",
    allowed: "Angenommen",
    created: "Erstellt",
    denied: "Abgelehnt",
    cancelled: "Gecancelled",
};

const categoryName: { [key in CourseCategory]: string } = {
    club: "Club",
    revision: "Wiederholung",
    coaching: "Coaching"
}


const Courses = () => {
    const [courseState, _setCourseState] = useState<CourseState>(CourseState.SUBMITTED);
    const [editCourse, setEditCourse] = useState<Course | null>(null);

    const { courses, loadCourses, loading, updateCourse } = useCourses({ initial: CourseState.SUBMITTED });

    function setCourseState(courseState: CourseState) {
        _setCourseState(courseState);
        loadCourses({ courseState });
    }

    return <div className="course-container">
        {editCourse && <UpdateCourse course={editCourse} updateCourse={updateCourse} close={() => setEditCourse(null)} />}
        {!editCourse && <CourseTable courseState={courseState} courses={courses} loading={loading} setCourseState={setCourseState} setEditCourse={setEditCourse} />}
    </div>
}

function CourseTable({ courseState, setCourseState, courses, loading, setEditCourse }: { courseState: CourseState, setCourseState(courseState: CourseState): void, courses: Course[], loading: boolean, setEditCourse(course: Course): void }) {

    const columns = [
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
        },
        {
            title: "Autoren",
            dataIndex: "instructors",
            key: "instructors",
            render: (instructors: Student[]) => instructors.map(instructor => instructor.firstname + " " + instructor.lastname).join(", ") || "-",
        },
        {
            title: "Erstellungsdatum",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (createdAt: string) => new Date(createdAt).toLocaleDateString(),
        }
    ];
    
    return (
        <div className="queue">
            <div className="header">
                <Title style={{ color: "#6c757d", marginTop: 0 }} level={4}>
                    Kurse
                </Title>
            </div>
            <Tabs
                defaultActiveKey={`submitted`}
                activeKey={courseState}
                onChange={k => setCourseState(k as CourseState)}>
                {Object.keys(courseStates).map((courseState) => {
                    return (
                        <Tabs.TabPane tab={courseStates[courseState as CourseState]} key={courseState}>
                            <Table loading={loading} columns={columns} dataSource={courses} onRow={record => ({ onClick() { setEditCourse(record); }})} className="hover"></Table>
                        </Tabs.TabPane>
                    );
                })}
            </Tabs>
        </div>
        
    );
};

function UpdateCourse({ course, updateCourse, close }: { course: Course, updateCourse(course: Course, update: ApiCourseUpdate): Promise<void>, close(): void }) {
    const [name, setName] = useState(course.name);
    const [outline, setOutline] = useState(course.outline);
    const [description, setDescription] = useState(course.description);
    const [category, setCategory] = useState<CourseCategory>(course.category);
    const [imageUrl, setImageUrl] = useState(course.imageUrl);
    const [screeningComment, setScreeningComment] = useState(course.screeningComment);
    const [commentFormActive, setCommentFormActive] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    const isEdited = 
        name !== course.name ||
        outline !== course.outline ||
        description !== course.description ||
        category !== course.category ||
        imageUrl !== course.imageUrl;


    function update(courseState: CourseState.ALLOWED | CourseState.CANCELLED | CourseState.DENIED | undefined) {
        updateCourse(course, {
            category, courseState, description, imageUrl, name, outline, screeningComment
        }).then(close);
    }

    const FieldEditor = ({ value, onChange }: { value: string, onChange(e: string): void}) => {
        const handleChange = useCallback((event: { target: { value: string; }; }) => {
            const text = event.target.value;
            onChange(text);
        }, []);

        return (
            <TextArea
                rows={4}
                value={ value }
                onChange={ handleChange }
            />
        )
    }

    const CommentCourse = () => {
        const [value, setValue] = useState<string>(screeningComment || "");
        const handleFieldChange = (new_value: string) => {
            setValue(new_value)
        };

        const submitComment = () => {
            setScreeningComment(value);
            setCommentFormActive(false);
        }

        const handleCancel = () => {
            setCommentFormActive(false);
        }

        return (
            <Modal title="Kommentieren" visible={ commentFormActive } onOk={ submitComment } onCancel={ handleCancel }>
                <div>
                    <FieldEditor value={ value } onChange={ handleFieldChange } />
                </div>
            </Modal>
        );
    }

    const Header = () => {
        return (
            <div className="course-header">
                <Space size="large">
                    <Button onClick={() => (!isEdited || window.confirm("Willst du die Änderungen verwerfen?")) && close()} icon={<ArrowLeftOutlined />}/>
                    
                    { !isEditMode && <Title style={{ color: "#6c757d"}} level={4}>{name}</Title> }
                    { isEditMode && <Input style={{ width: "100%"}} size="large" value={ name } onChange={ e => setName(e.target.value) } /> }
                    
                </Space>
                {!isEditMode && <Space size="small">
                    {/*<Button onClick={ () => setCommentFormActive(true) }
                            style={{ background: "#C4C4C4", color: "#FFFFFF"}}>
                        Kommentieren
                    </Button>*/}
                    <Button onClick={() => update(CourseState.ALLOWED)} style={{ background: "#B5F1BB" }}>
                        Annehmen
                    </Button>
                    <Button onClick={() => update(CourseState.DENIED)} style={{ background: "#F5AFAF" }}>
                        Ablehnen
                    </Button>
                    <Button onClick={() => setIsEditMode(true)} icon={<EditOutlined />}/>
                </Space>}

                {isEditMode && <Space size="small">
                    <Button onClick={ () => update(undefined)}
                            style={{ background: "#C4C4C4", color: "#FFFFFF"}}>
                        Speichern
                    </Button>
                    <Button onClick={() => update(CourseState.ALLOWED)} style={{ background: "#B5F1BB" }}>
                        Speichern und Annehmen
                    </Button>
                    <Button onClick={() => update(CourseState.DENIED)} style={{ background: "#F5AFAF" }}>
                        Speichern und Ablehnen
                    </Button>
                </Space>}

            </div>
        );
    };

    const CourseDetails = () => {
        const categoryMenu = (
            <Menu>
                {Object.entries(categoryName)
                    .map(([category, name]) => 
                        <Menu.Item onClick={() => setCategory(category as CourseCategory)}>
                                {name}
                        </Menu.Item>    
                )}
        
        
            </Menu>
        );

        return (
            <div className="course-details">
                <Card title={ <><FileTextOutlined /> Beschreibung:</> }>
                    { !isEditMode && description }
                    { isEditMode && <TextArea value={ description }
                                              onChange={(e) => setDescription(e.target.value) }/>
                    }
                </Card>
                <br/>
                <Card title={ <><FileTextOutlined /> Gliederung:</> }>
                    { !isEditMode && outline }
                    { isEditMode && <TextArea value={ outline }
                                              onChange={(e) => setOutline(e.target.value)}/>
                    }
                </Card>
                <br/>
                <Card title={<><FileTextOutlined /> Kategorie: </>}>
                    {!isEditMode && categoryName[category]}
                    {isEditMode && <Dropdown.Button overlay={categoryMenu} icon={<DownOutlined />}>
                        <a className="ant-dropdown-link" onClick={e => e.preventDefault()}>
                            {categoryName[category]}
                        </a>
                    </Dropdown.Button>}
                </Card>
                <br/>
                <Card title={ <><FileTextOutlined /> Kommentar:</> }>
                    { !isEditMode && screeningComment }
                    { isEditMode && <TextArea value={ screeningComment || "" }
                                              onChange={(e) => setScreeningComment(e.target.value)}/>
                    }
                </Card>
            </div>
        );
    };

    const MetaDetails = () => {
        return <div className="meta-details" >
            <Descriptions layout="vertical" column={1} bordered={true}>
                <Descriptions.Item label={ <><CalendarOutlined /> Erstellt am</> }>
                    { new Date(course.createdAt).toLocaleDateString() }
                </Descriptions.Item>
                <Descriptions.Item label={ <><CalendarOutlined /> Updated am</> }>
                    { new Date(course.updatedAt).toLocaleDateString() }
                </Descriptions.Item>
                <Descriptions.Item label={ <UserOutlined /> }>
                    {
                        course.instructors?.
                        map(instructor => instructor.firstname + " " + instructor.lastname).
                        join(", ") || "-"
                    }
                </Descriptions.Item>
            </Descriptions>
        </div>;
    };

    return (
        <div className="update-course">
            { Header() }
            { CourseDetails() }
            { MetaDetails() }
            { /* CommentCourse() */}
        </div>
    );
}


export default Courses;