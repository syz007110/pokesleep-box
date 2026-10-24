import { defineStore } from 'pinia'
import { ref } from 'vue'
import { listTeams, putTeam, replaceTeams } from '../db'
import { emptyTeam, type Team } from '../models/types'

export const useTeamStore = defineStore('team', () => {
  const teams = ref<Team[]>([])
  const activeId = ref<string | null>(null)
  const loaded = ref(false)

  function active() {
    return teams.value.find((team) => team.id === activeId.value) ?? teams.value[0]
  }

  async function hydrate() {
    teams.value = await listTeams()
    activeId.value = teams.value[0]?.id ?? null
    loaded.value = true
  }

  async function save(team: Team) {
    await putTeam(team)
    const index = teams.value.findIndex((item) => item.id === team.id)
    if (index >= 0) teams.value.splice(index, 1, team)
    else teams.value.push(team)
  }

  async function setMember(index: number, pokemonId: string | null) {
    const team = active()
    if (!team) return
    const memberIds = [...team.memberIds]
    memberIds[index] = pokemonId
    await save({ ...team, memberIds })
  }

  async function addTeam() {
    const team = emptyTeam(`队伍 ${teams.value.length + 1}`)
    await save(team)
    activeId.value = team.id
    return team
  }

  async function replaceAll(next: Team[]) {
    await replaceTeams(next)
    teams.value = next.length ? next : [emptyTeam()]
    activeId.value = teams.value[0]?.id ?? null
  }

  return { teams, activeId, loaded, active, hydrate, save, setMember, addTeam, replaceAll }
})
