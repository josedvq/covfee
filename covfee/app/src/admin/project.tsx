import * as React from 'react'
import {
    Menu,
    Select,
    Typography,
    Table
} from 'antd'
import { ColumnsType } from 'antd/es/table'
const { Title, Paragraph} = Typography
const { Option } = Select
import 'antd/dist/antd.css'
import {HITSpec} from '../hit'
const Constants = require('../constants.json')
import { fetcher, throwBadResponse } from '../utils'
import { LoadingOutlined } from '@ant-design/icons'

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
                id: hit.id,
                type: hit.type,
                tasks: hit.tasks.length,
                completed: hit.tasks.filter(t => (t.numSubmissions > 0)).length,
                submitted: hit.submitted
            }
        })

        const columns: ColumnsType<any> = [
            {
                title: 'ID',
                dataIndex: 'id'
            },
            {
                title: 'Type',
                dataIndex: 'type',
                defaultSortOrder: 'descend',
                sorter: (a, b) => a.firstname.localeCompare(b.firstname),
            },
            {
                title: 'Num Tasks',
                dataIndex: 'tasks',
                defaultSortOrder: 'descend',
                sorter: (a, b) => a - b
            },
            {
                title: 'Completed Tasks',
                dataIndex: 'completed',
                defaultSortOrder: 'descend',
                sorter: (a, b) => a - b,
            },
            {
                title: 'Submitted',
                dataIndex: 'submitted',
                defaultSortOrder: 'descend',
                sorter: (a, b) => a.firstname.localeCompare(b.firstname),
            }
        ]

        return <Table dataSource={data} columns={columns} />
    }
}

interface State {
    status: string,
    currProject: number
}

interface Props {}

class AdminProject extends React.Component<Props, State> {

    state: State = {
        status: 'loading',
        currProject: null
    }

    projects: Array<ProjectSpec> = null

    componentDidMount() {
        // fetch projects
        const url = Constants.api_url + '/projects?' + new URLSearchParams({
            with_hits: '1'
        })

        fetcher(url)
            .then(throwBadResponse)
            .then((projects) => {
                console.log(projects)
                this.projects = projects
                this.setState({
                    status: 'ready',
                    currProject: 0
                })
            })
            .catch(error => {
                console.error('error loading projects', error)
            })
    }

    handleProjectChange = (value: number) =>{
        this.setState({
            currProject: value
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

                console.log(this.projects[this.state.currProject])

                const hits = <HITList hits={this.projects[this.state.currProject].hits}></HITList>

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