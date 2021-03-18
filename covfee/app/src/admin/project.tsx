import * as React from 'react'
import {
    Select,
    Typography,
    Empty, 
    Button
} from 'antd'
const { Title, Paragraph} = Typography
const { Option } = Select
import 'antd/dist/antd.css'
import {HITSpec} from '../hit'
const Constants = require('Constants')
import { myerror, fetcher, throwBadResponse } from '../utils'
import {LoadingOutlined } from '@ant-design/icons'
import { HITList } from './hitlist'



interface ProjectSpec {
    id: string,
    name: string,
    email: string,
    hits: Array<HITSpec>
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
        loadingProject: true,

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
                myerror('Error loading projects.', error)
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
                myerror('error fetching project details', error)
            })
    }

    updateHit = (hitIndex: number, hit: any) => {
        this.project.hits[hitIndex] = hit
        this.forceUpdate()
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
                        <Empty description="There are no projects to show."/>
                    </Paragraph>
                </>
            case 'ready':
                const select = <Select 
                    value={this.state.currProject} 
                    onChange={this.handleProjectChange} 
                    style={{ width: 240 }}>
                    {this.projects.map((p, index) => {
                        return <Option key={index} value={index}>{p.name}</Option>
                    })}
                </Select>

                let hits
                if(this.state.loadingProject) {
                    hits = <LoadingOutlined />
                } else {
                    hits = <HITList 
                        hits={this.project.hits}
                        updateHit={this.updateHit}>
                        </HITList>
                }
                

                return <>
                    <div style={{margin: '2em 1em'}}>
                        Project: {select}
                        <Button type='primary' href={Constants.api_url + '/projects/' + this.projects[this.state.currProject].id + '/csv'}>Download URLs</Button>
                        <Button href={Constants.api_url + '/projects/' + this.projects[this.state.currProject].id + '/download?csv=1'}>Download results (CSV)</Button>
                    </div>
                    {hits}
                </>
            default:
                return <></>
        }
    }
}

export default AdminProject