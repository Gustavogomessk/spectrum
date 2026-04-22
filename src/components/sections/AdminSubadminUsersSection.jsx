import { useMemo, useState } from "react"
import { useSpectrum } from "../../context/SpectrumContext"
import { Edit2, Trash2, Plus, X } from "lucide-react"
import AppIcon from "../ui/AppIcon"

const USUARIO_PAPEIS = ["professor", "psicopedagogo", "secretaria", "subadmin"]
const USUARIO_LICENCAS = ["PRO", "Basic", "Secretaria"]

export default function AdminSubadminUsersSection({ active }) {
  const {
    usuario,
    adminData,
    criarUsuarioInstituicao,
    editarUsuario,
    deletarUsuario,
    toast,
  } = useSpectrum()

  const [novo, setNovo] = useState({ nome: "", email: "", senha: "", papel: "professor", licencas: 1, tipoLicenca: "Basic" })
  const [usuarioEdit, setUsuarioEdit] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [showFormNovo, setShowFormNovo] = useState(false)

  const instituicaoId = usuario?.schoolId || "inst-1"

  const usuarios = useMemo(
    () => (adminData?.usuarios || []).filter((u) => u.instituicaoId === instituicaoId),
    [adminData, instituicaoId]
  )

  async function handleCriarUsuario() {
    if (!novo.nome || !novo.email || !novo.senha) {
      return toast("Preencha nome, email e senha.", "erro")
    }
    if (String(novo.senha || "").length < 6) {
      return toast("A senha deve ter no mínimo 6 caracteres.", "erro")
    }
    try {
      await criarUsuarioInstituicao({ ...novo, instituicaoId })
      setNovo({ nome: "", email: "", senha: "", papel: "professor", licencas: 1, tipoLicenca: "Basic" })
      setShowFormNovo(false)
      toast("Usuário criado com sucesso.", "sucesso")
    } catch (err) {
      toast(`Erro ao criar usuário: ${err.message}`, "erro")
    }
  }

  async function handleAtualizarUsuario() {
    if (!usuarioEdit.nome || !usuarioEdit.email) {
      return toast("Preencha nome e email.", "erro")
    }
    if (usuarioEdit.senha && String(usuarioEdit.senha || "").length < 6) {
      return toast("A senha deve ter no mínimo 6 caracteres.", "erro")
    }
    try {
      const dadosAtualizacao = {
        nome: usuarioEdit.nome,
        email: usuarioEdit.email,
        papel: usuarioEdit.papel,
        tipoLicenca: usuarioEdit.tipoLicenca || "Basic",
      }
      // Só enviar senha se foi alterada
      if (usuarioEdit.senha) {
        dadosAtualizacao.senha = usuarioEdit.senha
      }
      await editarUsuario(usuarioEdit.id, dadosAtualizacao)
      setUsuarioEdit(null)
      toast("Usuário atualizado com sucesso.", "sucesso")
    } catch (err) {
      toast(`Erro ao atualizar usuário: ${err.message}`, "erro")
    }
  }

  async function handleDeletarUsuario() {
    try {
      await deletarUsuario(confirmDelete)
      setConfirmDelete(null)
      toast("Usuário deletado com sucesso.", "sucesso")
    } catch (err) {
      toast(`Erro ao deletar usuário: ${err.message}`, "erro")
    }
  }

  if (!active) return <section className="secao" />

  return (
    <section className={`secao ${active ? "ativa" : ""}`} id="secao-admin-subadmin-users" aria-label="Gestão de usuários">
      <div className="secao-corpo">
        {/* CARD: CRIAR NOVO USUÁRIO */}
        <div className="card mb-3">
          <div className="card-cabecalho" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="card-titulo">Usuários da Instituição</span>
            <button
              type="button"
              className="btn btn-pequeno btn-primario"
              onClick={() => setShowFormNovo(!showFormNovo)}
              aria-label="Criar novo usuário"
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                <AppIcon icon={Plus} size={16} />
                Novo Usuário
              </span>
            </button>
          </div>

          {showFormNovo && (
            <div className="card-corpo">
              <div className="linha-campos">
                <input
                  className="campo"
                  placeholder="Nome completo"
                  value={novo.nome}
                  onChange={(e) => setNovo((s) => ({ ...s, nome: e.target.value }))}
                />
                <input
                  className="campo"
                  placeholder="E-mail"
                  type="email"
                  value={novo.email}
                  onChange={(e) => setNovo((s) => ({ ...s, email: e.target.value }))}
                />
              </div>

              <div className="linha-campos">
                <input
                  className="campo"
                  type="password"
                  placeholder="Senha (mín. 6 caracteres)"
                  value={novo.senha}
                  onChange={(e) => setNovo((s) => ({ ...s, senha: e.target.value }))}
                />
              </div>

              <div className="linha-campos">
                <select
                  className="campo"
                  value={novo.papel}
                  onChange={(e) => setNovo((s) => ({ ...s, papel: e.target.value }))}
                  aria-label="Papel do usuário"
                >
                  {USUARIO_PAPEIS.map((papel) => (
                    <option key={papel} value={papel}>
                      {papel === "professor" && "Professor"}
                      {papel === "psicopedagogo" && "Psicopedagogo"}
                      {papel === "secretaria" && "Secretário"}
                      {papel === "subadmin" && "SubAdmin"}
                    </option>
                  ))}
                </select>

                <select
                  className="campo"
                  value={novo.tipoLicenca}
                  onChange={(e) => setNovo((s) => ({ ...s, tipoLicenca: e.target.value }))}
                  aria-label="Tipo de licença"
                >
                  {USUARIO_LICENCAS.map((lic) => (
                    <option key={lic} value={lic}>
                      {lic}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  className="btn btn-primario"
                  onClick={handleCriarUsuario}
                  style={{ flex: 1 }}
                >
                  Criar Usuário
                </button>
                <button
                  type="button"
                  className="btn btn-secundario"
                  onClick={() => {
                    setShowFormNovo(false)
                    setNovo({ nome: "", email: "", senha: "", papel: "professor", licencas: 1, tipoLicenca: "Basic" })
                  }}
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CARD: LISTA DE USUÁRIOS */}
        <div className="card">
          <div className="card-cabecalho">
            <span className="card-titulo">
              {usuarios.length === 0 ? "Nenhum usuário cadastrado" : `${usuarios.length} usuário(s) cadastrado(s)`}
            </span>
          </div>

          {usuarios.length > 0 && (
            <div className="card-corpo">
              <div className="tabela-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>E-mail</th>
                      <th>Papel</th>
                      <th>Licença</th>
                      <th style={{ width: "120px" }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((u) => (
                      <tr key={u.id}>
                        <td>{u.nome}</td>
                        <td>{u.email}</td>
                        <td>
                          {u.papel === "professor" && "Professor"}
                          {u.papel === "psicopedagogo" && "Psicopedagogo"}
                          {u.papel === "secretaria" && "Secretário"}
                          {u.papel === "subadmin" && "SubAdmin"}
                        </td>
                        <td>{u.tipoLicenca || "Basic"}</td>
                        <td>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                              type="button"
                              className="btn btn-pequeno"
                              onClick={() => setUsuarioEdit({ ...u, senhaAtual: "" })}
                              title="Editar usuário"
                              aria-label={`Editar ${u.nome}`}
                            >
                              <AppIcon icon={Edit2} size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-pequeno"
                              style={{ color: "var(--cor-perigo)" }}
                              onClick={() => setConfirmDelete(u.id)}
                              title="Deletar usuário"
                              aria-label={`Deletar ${u.nome}`}
                            >
                              <AppIcon icon={Trash2} size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: EDITAR USUÁRIO */}
      {usuarioEdit && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
        >
          <div className="card" style={{ width: "90%", maxWidth: "450px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <span className="card-titulo">Editar Usuário</span>
              <button
                type="button"
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.5rem" }}
                onClick={() => setUsuarioEdit(null)}
                aria-label="Fechar modal"
              >
                <AppIcon icon={X} size={20} />
              </button>
            </div>

            <div className="card-corpo">
              <label className="campo-label">Nome</label>
              <input
                className="campo"
                value={usuarioEdit.nome}
                onChange={(e) => setUsuarioEdit((u) => ({ ...u, nome: e.target.value }))}
              />

              <label className="campo-label" style={{ marginTop: "1rem" }}>
                E-mail
              </label>
              <input
                className="campo"
                type="email"
                value={usuarioEdit.email}
                onChange={(e) => setUsuarioEdit((u) => ({ ...u, email: e.target.value }))}
              />

              <label className="campo-label" style={{ marginTop: "1rem" }}>
                Senha (deixar em branco para não alterar)
              </label>
              <input
                className="campo"
                type="password"
                placeholder="Nova senha (6+ caracteres)"
                value={usuarioEdit.senha || ""}
                onChange={(e) => setUsuarioEdit((u) => ({ ...u, senha: e.target.value }))}
              />

              <label className="campo-label" style={{ marginTop: "1rem" }}>
                Papel / Função
              </label>
              <select
                className="campo"
                value={usuarioEdit.papel}
                onChange={(e) => setUsuarioEdit((u) => ({ ...u, papel: e.target.value }))}
              >
                {USUARIO_PAPEIS.map((papel) => (
                  <option key={papel} value={papel}>
                    {papel === "professor" && "Professor"}
                    {papel === "psicopedagogo" && "Psicopedagogo"}
                    {papel === "secretaria" && "Secretário"}
                    {papel === "subadmin" && "SubAdmin"}
                  </option>
                ))}
              </select>

              <label className="campo-label" style={{ marginTop: "1rem" }}>
                Tipo de Licença
              </label>
              <select
                className="campo"
                value={usuarioEdit.tipoLicenca || "Basic"}
                onChange={(e) => setUsuarioEdit((u) => ({ ...u, tipoLicenca: e.target.value }))}
              >
                {USUARIO_LICENCAS.map((lic) => (
                  <option key={lic} value={lic}>
                    {lic}
                  </option>
                ))}
              </select>

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem" }}>
                <button
                  type="button"
                  className="btn btn-primario"
                  style={{ flex: 1 }}
                  onClick={handleAtualizarUsuario}
                >
                  Salvar Alterações
                </button>
                <button
                  type="button"
                  className="btn btn-secundario"
                  style={{ flex: 1 }}
                  onClick={() => setUsuarioEdit(null)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR DELEÇÃO */}
      {confirmDelete && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div className="card" style={{ width: "90%", maxWidth: "350px" }}>
            <div className="card-corpo">
              <p style={{ marginBottom: "1.5rem", fontSize: "0.95rem" }}>
                Tem certeza que deseja deletar este usuário? Esta ação não pode ser desfeita.
              </p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  className="btn"
                  style={{ flex: 1, background: "var(--cor-perigo)", color: "white" }}
                  onClick={handleDeletarUsuario}
                >
                  Deletar
                </button>
                <button
                  type="button"
                  className="btn btn-secundario"
                  style={{ flex: 1 }}
                  onClick={() => setConfirmDelete(null)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
