import * as React from 'react'
import {
    Menu,
    Select,
    Typography,
    Table
} from 'antd'
import {
    Link,
} from "react-router-dom"
import { ColumnsType } from 'antd/es/table'
const { Title, Paragraph} = Typography
const { Option } = Select
import 'antd/dist/antd.css'
import {HITSpec} from '../hit'
const Constants = require('../constants.json')
import { fetcher, throwBadResponse } from '../utils'
import { IdcardFilled, LoadingOutlined } from '@ant-design/icons'

class InstanceListAsync extends React.Component {
    state = {
        loading: true
    }
    id: string
    url: string
    hit: object

    constructor(props) {
        super(props)
        this.id = props.id
        this.url = Constants.api_url + '/hits/' + this.id
    }
    
    componentDidMount() {
        // fetch projects
        const url = this.url + '?' + new URLSearchParams({
            with_instances: '1',
            with_tasks: '1',
            with_instance_tasks: '1'
        })

        fetcher(url)
            .then(throwBadResponse)
            .then((hit) => {
                this.hit = hit
                this.setState({ loading: false })
            })
            .catch(error => {
                console.error('error loading projects', error)
            })
    }

    render() {
        if(this.state.loading)
            return <LoadingOutlined/>
        else
            return <InstanceList instances={this.hit.instances} />
    }
}

class InstanceList extends React.Component {
    render() {

        const data = this.props.instances.map((instance, index) => {
            return {
                key: instance.id,
                id: instance.id,
                tasks: Object.keys(instance.tasks).length,
                url: Constants.api_url + '/instances/' + instance.id
            }
        })

        const columns: ColumnsType<any> = [
            {
                title: 'ID',
                dataIndex: 'id',
                render: id => <a href={Constants.app_url + '/hits/' + id} target="blank">{id.substring(0, 16)}</a>
            },
            {
                title: 'Tasks',
                dataIndex: 'tasks',
                defaultSortOrder: 'descend',
                sorter: (a, b) => a-b,
            },
            {
                title: 'Data',
                dataIndex: 'url',
                render: url => <a href={url + '/download'}>Download</a>
            }
        ]

        return <Table dataSource={data} columns={columns} size="small" pagination={false} indentSize={45}/>
    }
}

interface ProjectSpec {
    id: string,
    name: string,
    email: string,
    hits: Array<HITSpec>
}

interface HITListProps { hits: Array<HITSpec>}
class HITList extends React.Component<HITListProps> {
    render() {
        const data = this.props.hits.map((hit, index)=>{
            return {
                key: hit.id,
                id: hit.id,
                type: hit.type,
                instances: hit.instances.length,
                submitted: hit.submitted
            }
        })

        const columns: ColumnsType<any> = [
            {
                title: 'ID',
                dataIndex: 'id',
                render: id => id.substring(0, 16)
            },
            {
                title: 'Type',
                dataIndex: 'type',
                defaultSortOrder: 'descend',
                sorter: (a, b) => a.toString().localeCompare(b.toString()),
            },
            {
                title: 'Instances',
                dataIndex: 'instances',
                defaultSortOrder: 'descend',
                sorter: (a, b) => a - b
            },
            {
                title: 'Submitted',
                dataIndex: 'submitted',
                defaultSortOrder: 'descend',
                sorter: (a, b) => a.toString().localeCompare(b.toString()),
            }
        ]

        return <Table dataSource={data} columns={columns} size="small" pagination={false} expandable={{
            expandedRowRender: record => <InstanceListAsync id={record.id}/>,
            rowExpandable: record => true,
        }}/>
    }
}

interface State {
    status: string,
    currProject: number,
    loadingProject: boolean
}

interface Props {}

class AdminProject extends React.Component<Props, State> {

    state: State = {
        status: 'loading',
        currProject: null,
        loadingProject: true
    }

    project: ProjectSpec
    projects: Array<ProjectSpec> = []

    componentDidMount() {
        // fetch projects
        const url = Constants.api_url + '/projects?' + new URLSearchParams({
            with_hits: '1'
        })

        fetcher(url)
            .then(throwBadResponse)
            .then((projects) => {
                if(projects.length == 0) {
                    this.setState({
                        status: 'empty',
                    })
                } else {
                    this.projects = projects
                    this.setState({
                        status: 'ready',
                        currProject: 0
                    })
                    this.handleProjectChange(0)
                }
            })
            .catch(error => {
                console.error('error loading projects', error)
            })
    }

    handleProjectChange = (value: number) =>{

        this.setState({
            loadingProject: true,
            currProject: value
        })

        const url = Constants.api_url + '/projects/' + this.projects[value].id + '?' + new URLSearchParams({
            with_hits: '1',
            with_instances: '1'
        })

        fetcher(url)
            .then(throwBadResponse)
            .then((project) => {
                this.project = project
                this.setState({
                    loadingProject: false
                })
            })
            .catch(error => {
                console.error('error fetching project', error)
            })
    }

    render() {
        switch (this.state.status) {
            case 'loading':
                return <div className={'site-layout-content'}>
                    <LoadingOutlined />
                </div>
            case 'empty': 
                return <>
                    <Title>
                        Ooops!
                    </Title>
                    <Paragraph>
                        There are no projects to show.
                    </Paragraph>
                </>
            case 'ready':
                const select = <Select value={this.state.currProject} onChange={this.handleProjectChange} style={{ width: 120 }}>
                    {this.projects.map((p, index) => {
                        return <Option key={index} value={index}>{p.name}</Option>
                    })}
                </Select>

                let hits
                if(this.state.loadingProject) {
                    hits = <LoadingOutlined />
                } else {
                    hits = <HITList hits={this.project.hits}></HITList>
                }
                

                return <>
                    {select}
                    {hits}
                </>
            default:
                return <></>
        }
    }
}

export default AdminProject